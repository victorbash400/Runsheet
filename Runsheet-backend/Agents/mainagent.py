import os
import logging
from typing import AsyncGenerator
from strands import Agent, tool
from strands.models.litellm import LiteLLMModel
from dotenv import load_dotenv
from services.elasticsearch_service import elasticsearch_service

# Load environment variables
load_dotenv()

# Disable OpenTelemetry to avoid context errors
os.environ['OTEL_SDK_DISABLED'] = 'true'
os.environ['OTEL_PYTHON_DISABLED'] = 'true'
os.environ['OTEL_EXPORTER_OTLP_ENDPOINT'] = ''

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress OpenTelemetry warnings and errors
logging.getLogger('opentelemetry').setLevel(logging.CRITICAL)
logging.getLogger('opentelemetry.context').setLevel(logging.CRITICAL)

@tool
async def search_fleet_data(query: str) -> str:
    """
    Search fleet and truck data using natural language.
    
    Args:
        query: Natural language search query (e.g., "trucks carrying perishables", "delayed vehicles")
    
    Returns:
        Search results from fleet database
    """
    try:
        logger.info(f"🔍 Searching fleet data for: {query}")
        results = await elasticsearch_service.semantic_search("trucks", query, ["cargo.description", "driver_name", "status"], 5)
        
        if not results:
            return f"No fleet data found for query: '{query}'"
        
        response = f"🚛 Found {len(results)} trucks matching '{query}':\n\n"
        for truck in results:
            response += f"• **{truck.get('plate_number')}** - {truck.get('driver_name')}\n"
            response += f"  Status: {truck.get('status')}\n"
            if truck.get('cargo'):
                response += f"  Cargo: {truck.get('cargo', {}).get('description', 'N/A')}\n"
            response += f"  Location: {truck.get('current_location', {}).get('name', 'Unknown')}\n\n"
        
        return response
    except Exception as e:
        logger.error(f"Error searching fleet data: {e}")
        return f"Error searching fleet data: {str(e)}"

@tool
async def search_orders(query: str) -> str:
    """
    Search order data using natural language.
    
    Args:
        query: Natural language search query (e.g., "network equipment orders", "high priority deliveries")
    
    Returns:
        Search results from orders database
    """
    try:
        logger.info(f"🔍 Searching orders for: {query}")
        results = await elasticsearch_service.semantic_search("orders", query, ["items", "customer"], 5)
        
        if not results:
            return f"No orders found for query: '{query}'"
        
        response = f"📦 Found {len(results)} orders matching '{query}':\n\n"
        for order in results:
            response += f"• **{order.get('order_id')}** - {order.get('customer')}\n"
            response += f"  Status: {order.get('status')}\n"
            response += f"  Value: ${order.get('value', 0):,.2f}\n"
            response += f"  Items: {order.get('items', 'N/A')}\n"
            response += f"  Priority: {order.get('priority', 'N/A')}\n\n"
        
        return response
    except Exception as e:
        logger.error(f"Error searching orders: {e}")
        return f"Error searching orders: {str(e)}"

@tool
async def search_support_tickets(query: str) -> str:
    """
    Search support tickets using natural language.
    
    Args:
        query: Natural language search query (e.g., "delivery delays", "damaged goods")
    
    Returns:
        Search results from support tickets database
    """
    try:
        logger.info(f"🔍 Searching support tickets for: {query}")
        results = await elasticsearch_service.semantic_search("support_tickets", query, ["issue", "description"], 5)
        
        if not results:
            return f"No support tickets found for query: '{query}'"
        
        response = f"🎫 Found {len(results)} support tickets matching '{query}':\n\n"
        for ticket in results:
            response += f"• **{ticket.get('ticket_id')}** - {ticket.get('customer')}\n"
            response += f"  Issue: {ticket.get('issue')}\n"
            response += f"  Priority: {ticket.get('priority')}\n"
            response += f"  Status: {ticket.get('status')}\n"
            response += f"  Description: {ticket.get('description', 'N/A')[:100]}...\n\n"
        
        return response
    except Exception as e:
        logger.error(f"Error searching support tickets: {e}")
        return f"Error searching support tickets: {str(e)}"

@tool
async def get_fleet_summary() -> str:
    """
    Get current fleet status summary.
    
    Returns:
        Summary of fleet status including total trucks, delays, etc.
    """
    try:
        logger.info("📊 Getting fleet summary")
        trucks = await elasticsearch_service.get_all_documents("trucks")
        
        total = len(trucks)
        on_time = len([t for t in trucks if t.get("status") == "on_time"])
        delayed = len([t for t in trucks if t.get("status") == "delayed"])
        
        response = f"🚛 **Fleet Summary**\n\n"
        response += f"• Total Trucks: {total}\n"
        response += f"• On Time: {on_time}\n"
        response += f"• Delayed: {delayed}\n"
        response += f"• Performance: {(on_time/total*100):.1f}% on time\n\n"
        
        if delayed > 0:
            response += "**Delayed Trucks:**\n"
            for truck in trucks:
                if truck.get("status") == "delayed":
                    response += f"• {truck.get('plate_number')} - {truck.get('driver_name')}\n"
        
        return response
    except Exception as e:
        logger.error(f"Error getting fleet summary: {e}")
        return f"Error getting fleet summary: {str(e)}"

class LogisticsAgent:
    def __init__(self):
        # Setup Google credentials
        self.setup_gemini_credentials()
        
        # Initialize Gemini model through LiteLLM
        gemini_model = LiteLLMModel(
            model_id="vertex_ai/gemini-2.5-flash",
            client_args={
                "vertex_project": os.environ.get('GOOGLE_CLOUD_PROJECT', 'ascendant-woods-462020-n0'),
                "vertex_location": "us-central1",
            },
            params={
                "max_tokens": 8000,
                "temperature": 0.7,
            }
        )
        
        # Initialize Strands Agent with the Gemini model
        self.agent = Agent(
            model=gemini_model,
            system_prompt="""You are a Logistics AI Assistant for a fleet management and logistics platform. You help users manage their transportation operations, track deliveries, and optimize logistics workflows.

            **YOU NOW HAVE ACCESS TO LIVE DATA!** You can search and analyze real fleet, order, and support data using your tools.

            **CHAT MODE:**
            When in Chat Mode, you:
            - Answer questions about logistics using real data from your tools
            - ALWAYS announce your actions: "Let me search for [topic]..." BEFORE using tools
            - Use semantic search to find relevant information
            - Provide insights based on actual data
            - Be conversational and helpful
            - Explain what you found and provide actionable insights

            **AGENT MODE:**
            When in Agent Mode, you:
            - Gather requirements and ask clarifying questions
            - Explain your plan before executing
            - Use tools to analyze real data systematically
            - Provide structured analysis and recommendations
            - Be more formal and systematic in your approach

            **Available Tools:**
            - `search_fleet_data(query)` - Search trucks and fleet information
            - `search_orders(query)` - Search customer orders and deliveries  
            - `search_support_tickets(query)` - Search support issues and tickets
            - `get_fleet_summary()` - Get current fleet status overview

            **Your Expertise Areas:**
            - Fleet tracking and vehicle management
            - Route optimization and planning
            - Delivery scheduling and coordination
            - Customer order processing
            - Support ticket analysis
            - Logistics performance analytics
            - Supply chain optimization

            **Your Personality:**
            - Professional logistics expert with access to live data
            - Always explain what you're searching for before using tools
            - Provide actionable insights based on real information
            - Clear communicator who builds trust through transparency

            **Example Interactions:**
            User: "Show me delayed trucks"
            You: "Let me search for delayed vehicles in our fleet..." [calls get_fleet_summary]
            You: "I found [X] delayed trucks. Here's the breakdown: [results and analysis]"

            User: "Find orders with network equipment"  
            You: "Let me search our orders for network equipment..." [calls search_orders]
            You: "I found [X] orders containing network equipment: [results and insights]"

            Always announce your tool usage and explain the results clearly.""",
            tools=[
                search_fleet_data,
                search_orders, 
                search_support_tickets,
                get_fleet_summary
            ]
        )
        logger.info("✅ Logistics Agent initialized with Strands + Gemini 2.5 Flash")

    def setup_gemini_credentials(self):
        """Setup Gemini credentials using the service account file"""
        try:
            # Use the correct path to the credentials file
            credentials_path = "C:/Users/Victo/Desktop/Runsheet/Runsheet-backend/ascendant-woods-462020-n0-78d818c9658e.json"
            
            if os.path.exists(credentials_path):
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
                os.environ['GOOGLE_CLOUD_PROJECT'] = 'ascendant-woods-462020-n0'
                logger.info("✅ Gemini credentials configured successfully")
            else:
                raise FileNotFoundError(f"Credentials file not found: {credentials_path}")
                
        except Exception as e:
            logger.error(f"Failed to setup Gemini credentials: {e}")
            raise

    def clear_memory(self):
        """Clear the agent's conversation memory"""
        try:
            # Clear Strands agent's message history
            self.agent.messages = []
            logger.info("✅ Agent memory cleared")
        except Exception as e:
            logger.error(f"Failed to clear agent memory: {e}")

    async def chat_streaming(self, message: str, mode: str = "chat") -> AsyncGenerator[dict, None]:
        """Asynchronous streaming chat method"""
        try:
            # Add mode context to the message
            message_with_context = f"[Mode: {mode.upper()}] {message}"
            
            async for event in self.agent.stream_async(message_with_context):
                yield event
        except Exception as e:
            logger.error(f"Error in streaming chat: {e}")
            yield {"error": str(e)}