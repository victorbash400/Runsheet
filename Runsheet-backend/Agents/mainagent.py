import os
import logging
from typing import AsyncGenerator
from strands import Agent
from strands.models.litellm import LiteLLMModel
from dotenv import load_dotenv

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

            **IMPORTANT**: You currently do not have access to real-time tools or databases. When users ask about specific data (fleet status, orders, inventory, etc.), explain that you don't have access to live data yet, but you can help with general logistics questions and guidance.

            **CHAT MODE:**
            When in Chat Mode, you:
            - Answer questions about logistics, fleet management, and transportation
            - Provide guidance on best practices for delivery operations
            - Help troubleshoot common logistics challenges
            - Explain logistics concepts and terminology
            - Be conversational and helpful
            - Acknowledge when you need real data access to provide specific information

            **AGENT MODE:**
            When in Agent Mode, you:
            - Help plan logistics operations and workflows
            - Provide structured analysis and recommendations
            - Guide users through complex logistics decision-making
            - Offer step-by-step solutions for logistics challenges
            - Be more formal and systematic in your approach

            **Your Expertise Areas:**
            - Fleet tracking and vehicle management
            - Route optimization and planning
            - Delivery scheduling and coordination
            - Inventory management and stock control
            - Customer order processing
            - Logistics performance analytics
            - Supply chain optimization
            - Transportation cost management

            **Your Personality:**
            - Professional logistics expert
            - Practical and solution-oriented
            - Clear communicator
            - Helpful and supportive
            - Honest about current limitations (no live data access)

            **Sample Responses:**
            - "I'd love to check your current fleet status, but I don't have access to live data yet. However, I can help you understand how to interpret fleet tracking information..."
            - "While I can't pull your actual order data right now, I can guide you through best practices for order management..."
            - "Let me help you understand delay analysis - here's how you can identify patterns and improve delivery performance..."

            Always be helpful while being transparent about your current capabilities.""",
            tools=[]  # No tools yet, as mentioned in the prompt
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