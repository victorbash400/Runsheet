import os
import logging
from typing import AsyncGenerator
from strands import Agent, tool
from strands.models.litellm import LiteLLMModel
from dotenv import load_dotenv

# Import specialist agents
from .exam_agent import run_exam_agent
from .course_agent import run_course_agent
from .flashcards_agent import run_flashcards_agent

# Load environment variables
load_dotenv()

# Disable OpenTelemetry to avoid context errors
os.environ['OTEL_SDK_DISABLED'] = 'true'

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress OpenTelemetry warnings
logging.getLogger('opentelemetry').setLevel(logging.ERROR)


@tool
async def send_tool_progress(tool_name: str, message: str) -> str:
    """
    Send tool progress updates to frontend.
    
    Args:
        tool_name: Name of the tool being used
        message: Progress message to display
    
    Returns:
        Confirmation message
    """
    from utils.event_queue import event_queue, StreamEvent
    import uuid
    
    # Create structured event
    event = StreamEvent(
        agentName="PapertrailAI",
        eventType="tool_call",
        payload={
            "tool_name": tool_name,
            "tool_input": {"message": message},
            "display_message": message
        },
        traceId=str(uuid.uuid4()),
        spanId=str(uuid.uuid4()),
        parentSpanId="main"
    )
    
    # Send to event queue (non-blocking)
    try:
        event_queue.get_queue().put_nowait(event.dict())
        logger.info(f"Tool progress sent: {tool_name} - {message}")
    except Exception as e:
        logger.error(f"Failed to send tool progress: {e}")
    
    return f"Progress update sent: {message}"

@tool
async def search_papers(query: str) -> str:
    """
    Search academic papers and research materials.
    This is a placeholder tool for testing the chat mode functionality.
    
    Args:
        query: The search query for academic papers
    
    Returns:
        Search results from academic databases
    """
    # Send progress update
    await send_tool_progress("search_papers", f"Searching for papers on '{query}'...")
    
    # Simulate search delay
    import asyncio
    await asyncio.sleep(1)
    
    # Send completion update
    await send_tool_progress("search_papers", f"Found relevant papers for '{query}'")
    
    return f"📚 Found relevant papers for query: '{query}'. This is a placeholder - actual paper search functionality will be implemented later."


@tool
async def exam_agent(subject: str, difficulty: str, question_count: str) -> str:
    """
    Call the Exam Agent to generate a mock exam.
    
    Args:
        subject: The subject area for the exam
        difficulty: Difficulty level (beginner, intermediate, advanced)
        question_count: Number of questions to generate
    
    Returns:
        Result from the exam generation process
    """
    tasks = [subject, difficulty, question_count]
    result_content = ""
    
    async for event in run_exam_agent(tasks):
        if event.get('event') == 'contentBlockDelta' and 'text' in event.get('delta', {}):
            result_content += event['delta']['text']
    
    return result_content or "Exam agent completed successfully."


@tool
async def course_agent(subject: str, weeks: str) -> str:
    """
    Call the Course Agent to generate a study course.
    
    Args:
        subject: The subject area for the course
        weeks: Number of weeks for the course duration
    
    Returns:
        Result from the course generation process
    """
    tasks = [subject, weeks]
    result_content = ""
    
    async for event in run_course_agent(tasks):
        if event.get('event') == 'contentBlockDelta' and 'text' in event.get('delta', {}):
            result_content += event['delta']['text']
    
    return result_content or "Course agent completed successfully."


@tool
async def flashcards_agent(subject: str, topic: str, card_count: str) -> str:
    """
    Call the Flashcards Agent to generate study flashcards.
    
    Args:
        subject: The subject area for the flashcards
        topic: Specific topic within the subject
        card_count: Number of flashcards to generate
    
    Returns:
        Result from the flashcards generation process
    """
    tasks = [subject, topic, card_count]
    result_content = ""
    
    async for event in run_flashcards_agent(tasks):
        if event.get('event') == 'contentBlockDelta' and 'text' in event.get('delta', {}):
            result_content += event['delta']['text']
    
    return result_content or "Flashcards agent completed successfully."

class MainAgent:
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
            system_prompt="""You are Papertrail AI, an academic research and study assistant. You operate in one of two modes based on the user's selection:

            **CHAT MODE:**
            When the user has selected Chat Mode, you:
            - Answer questions about academic topics and research
            - ALWAYS announce your actions: "Let me search for papers on [topic]..." BEFORE calling `search_papers`
            - After tool results, explain what you found and provide insights
            - Provide explanations and help with research exploration
            - Be conversational, informative, and educational
            - Focus on helping users understand concepts and find information
            
            **IMPORTANT**: Always tell the user what you're about to do before using any tools.

            **AGENT MODE:**
            When the user has selected Agent Mode, you help create academic deliverables following this workflow:

            1. **Gather Requirements**: Ask clarifying questions to get all needed parameters
            2. **Explain Plan**: Clearly state what you will do and which agent you'll call with what parameters
            3. **Seek Confirmation**: Always ask "Should I proceed?" before calling any tools
            4. **Execute**: Only after user confirms, call the appropriate specialist agent
            5. **Report Results**: Summarize what was accomplished and offer next steps

            **Example Agent Mode Flow:**
            User: "Create a biology exam"
            You: "I'll help you create a biology exam. What difficulty level and how many questions would you like?"
            User: "Intermediate, 20 questions"  
            You: "Perfect! I'm going to call the Exam Agent with these parameters:
            - Subject: Biology
            - Difficulty: Intermediate
            - Questions: 20
            
            The Exam Agent will search academic papers for biology content and generate 20 intermediate-level questions with an answer key. Should I proceed?"
            User: "Yes"
            You: "Calling the Exam Agent now..." [calls exam_agent tool]
            You: "✅ Exam creation completed! [summarize results and offer next steps]"

            **Available Specialist Agents (Agent Mode only):**
            - `exam_agent(subject, difficulty, question_count)` - Generate mock exams
            - `course_agent(subject, weeks)` - Create multi-week study courses  
            - `flashcards_agent(subject, topic, card_count)` - Generate flashcard decks

            **Your Personality:**
            - Professional yet approachable academic assistant
            - Always explain before executing in Agent Mode
            - Never call specialist agent tools without explicit user confirmation
            - Clear communicator who builds trust through transparency

            The user's mode selection determines your behavior - you don't need to detect or switch modes and never suggest agent mode tasks when ur in chat mode.""",
            tools=[
                search_papers,
                send_tool_progress,
                exam_agent,
                course_agent,
                flashcards_agent
            ]
        )
        logger.info("✅ Main Agent initialized with Strands + Gemini 2.5 Flash")

    def setup_gemini_credentials(self):
        """Setup Gemini credentials using the service account file"""
        try:
            # Go up one level to find credentials in parent directory
            credentials_path = "../ascendant-woods-462020-n0-78d818c9658e.json"
            
            if os.path.exists(credentials_path):
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.path.abspath(credentials_path)
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

    async def chat_streaming(self, message_with_context: str) -> AsyncGenerator[dict, None]:
        """Asynchronous streaming chat method - just talks to Gemini"""
        try:
            async for event in self.agent.stream_async(message_with_context):
                yield event
        except Exception as e:
            logger.error(f"Error in streaming chat: {e}")
            yield {"error": str(e)}