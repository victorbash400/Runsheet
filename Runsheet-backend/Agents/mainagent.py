import os
import logging
from typing import AsyncGenerator
from strands import Agent
from strands.models.litellm import LiteLLMModel
from dotenv import load_dotenv
from .tools import ALL_TOOLS

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
            - Generate comprehensive reports using multiple tools
            - Provide structured analysis with markdown formatting
            - Use report generation tools for complex analysis
            - Be systematic and thorough in data gathering
            - Present findings in a professional report format
            - Always explain your methodology and data sources

            **Available Tools:**
            - `search_fleet_data(query)` - Search trucks using semantic search
            - `search_orders(query)` - Search orders using semantic search  
            - `search_support_tickets(query)` - Search support tickets using semantic search
            - `search_inventory(query)` - Search inventory items using semantic search
            - `get_inventory_summary()` - Get all inventory items organized by status
            - `get_fleet_summary()` - Get current fleet status overview
            - `get_analytics_overview()` - Get performance metrics and KPIs
            - `get_performance_insights()` - Get actionable performance insights
            - `find_truck_by_id(truck_id)` - Find specific truck by ID/plate number
            - `get_all_locations()` - Get all depots, warehouses, and stations
            - `generate_operations_report()` - Generate comprehensive operations status report
            - `generate_performance_report()` - Generate detailed performance analysis report
            - `generate_incident_analysis(issue)` - Analyze incidents across multiple data sources

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
            tools=ALL_TOOLS
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
        """Asynchronous streaming chat method with retry logic"""
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # Add mode context to the message
                message_with_context = f"[Mode: {mode.upper()}] {message}"
                
                # Track if we got any response
                got_response = False
                
                async for event in self.agent.stream_async(message_with_context):
                    got_response = True
                    yield event
                
                # If we got here without exception, we're done
                return
                
            except Exception as e:
                retry_count += 1
                error_msg = str(e)
                
                # Check if it's a connection error
                is_connection_error = any(keyword in error_msg.lower() for keyword in [
                    'connection closed', 'connection error', 'timeout', 'unavailable'
                ])
                
                if is_connection_error and retry_count < max_retries:
                    logger.warning(f"Connection error (attempt {retry_count}/{max_retries}): {error_msg}")
                    yield {
                        "type": "status",
                        "content": f"🔄 Connection interrupted, retrying... (attempt {retry_count}/{max_retries})"
                    }
                    
                    # Wait a bit before retrying
                    import asyncio
                    await asyncio.sleep(1 * retry_count)  # Exponential backoff
                    continue
                else:
                    # Non-connection error or max retries reached
                    logger.error(f"Error in streaming chat (final): {e}")
                    
                    if retry_count >= max_retries:
                        yield {
                            "type": "error", 
                            "content": f"❌ Connection failed after {max_retries} attempts. The tools work fine, but the AI service is having connectivity issues. Please try again in a moment."
                        }
                    else:
                        yield {
                            "type": "error",
                            "content": f"❌ Error: {error_msg}"
                        }
                    return

    async def chat_fallback(self, message: str, mode: str = "chat") -> str:
        """Non-streaming fallback method for when streaming fails"""
        try:
            logger.info("🔄 Using non-streaming fallback mode")
            message_with_context = f"[Mode: {mode.upper()}] {message}"
            
            # Use non-streaming completion
            response = await self.agent.run_async(message_with_context)
            return response
            
        except Exception as e:
            logger.error(f"Error in fallback chat: {e}")
            return f"❌ I'm having trouble connecting to the AI service right now. However, all the data tools are working fine. Please try again in a moment."