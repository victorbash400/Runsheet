#!/usr/bin/env python3
"""
Test script to directly test agent tools without Gemini
"""

import asyncio
import logging
from services.elasticsearch_service import elasticsearch_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_search_inventory(query: str):
    """Test the search_inventory tool directly"""
    try:
        logger.info(f"📦 Testing inventory search for: {query}")
        
        # First try semantic search
        try:
            results = await elasticsearch_service.semantic_search("inventory", query, ["name"], 10)
            logger.info(f"✅ Semantic search returned {len(results)} results")
        except Exception as search_error:
            logger.warning(f"❌ Semantic search failed: {search_error}")
            # Fallback to get all and filter
            all_items = await elasticsearch_service.get_all_documents("inventory")
            results = [item for item in all_items if query.lower() in item.get('name', '').lower()]
            logger.info(f"✅ Fallback search returned {len(results)} results")
        
        if not results:
            return f"No inventory items found for: '{query}'"
        
        response = f"📦 Found {len(results)} inventory items:\n\n"
        for item in results:
            status_emoji = "🟢" if item.get('status') == 'in_stock' else "🟡" if item.get('status') == 'low_stock' else "🔴"
            response += f"{status_emoji} **{item.get('name')}**\n"
            response += f"  • Quantity: {item.get('quantity')} {item.get('unit')}\n"
            response += f"  • Location: {item.get('location')}\n"
            response += f"  • Status: {item.get('status')}\n\n"
        
        return response
    except Exception as e:
        logger.error(f"❌ Error searching inventory: {e}")
        return f"Error searching inventory: {str(e)}"

async def test_get_all_inventory():
    """Test getting all inventory items"""
    try:
        logger.info("📦 Testing get all inventory")
        inventory = await elasticsearch_service.get_all_documents("inventory")
        
        logger.info(f"✅ Found {len(inventory)} total inventory items")
        
        if not inventory:
            return "No inventory data found. The inventory might not be seeded yet."
        
        response = f"📦 **All Inventory** ({len(inventory)} total items)\n\n"
        
        for item in inventory:
            status_emoji = "🟢" if item.get('status') == 'in_stock' else "🟡" if item.get('status') == 'low_stock' else "🔴"
            response += f"{status_emoji} **{item.get('name')}**\n"
            response += f"  • ID: {item.get('item_id')}\n"
            response += f"  • Quantity: {item.get('quantity')} {item.get('unit')}\n"
            response += f"  • Location: {item.get('location')}\n"
            response += f"  • Status: {item.get('status')}\n"
            response += f"  • Category: {item.get('category')}\n\n"
        
        return response
    except Exception as e:
        logger.error(f"❌ Error getting inventory: {e}")
        return f"Error getting inventory: {str(e)}"

async def test_search_support_tickets(query: str):
    """Test the search_support_tickets tool directly"""
    try:
        logger.info(f"🎫 Testing support ticket search for: {query}")
        results = await elasticsearch_service.semantic_search("support_tickets", query, ["issue", "description"], 5)
        
        if not results:
            return f"No support tickets found for query: '{query}'"
        
        response = f"🎫 Found {len(results)} support tickets matching '{query}':\n\n"
        for ticket in results:
            priority_emoji = "🚨" if ticket.get('priority') == 'urgent' else "🔴" if ticket.get('priority') == 'high' else "🟡" if ticket.get('priority') == 'medium' else "🟢"
            response += f"• {priority_emoji} **{ticket.get('ticket_id')}** - {ticket.get('customer')}\n"
            response += f"  Issue: {ticket.get('issue')}\n"
            response += f"  Priority: {ticket.get('priority')}\n"
            response += f"  Status: {ticket.get('status')}\n"
            response += f"  Description: {ticket.get('description', 'N/A')[:100]}...\n\n"
        
        return response
    except Exception as e:
        logger.error(f"❌ Error searching support tickets: {e}")
        return f"Error searching support tickets: {str(e)}"

async def test_get_all_support_tickets():
    """Test getting all support tickets"""
    try:
        logger.info("🎫 Testing get all support tickets")
        tickets = await elasticsearch_service.get_all_documents("support_tickets")
        
        logger.info(f"✅ Found {len(tickets)} total support tickets")
        
        if not tickets:
            return "No support ticket data found."
        
        response = f"🎫 **All Support Tickets** ({len(tickets)} total)\n\n"
        
        # Group by priority
        urgent = [t for t in tickets if t.get('priority') == 'urgent']
        high = [t for t in tickets if t.get('priority') == 'high']
        medium = [t for t in tickets if t.get('priority') == 'medium']
        low = [t for t in tickets if t.get('priority') == 'low']
        
        if urgent:
            response += "🚨 **URGENT TICKETS:**\n"
            for ticket in urgent:
                response += f"• {ticket.get('ticket_id')} - {ticket.get('customer')} - {ticket.get('issue')}\n"
            response += "\n"
        
        if high:
            response += "🔴 **HIGH PRIORITY:**\n"
            for ticket in high:
                response += f"• {ticket.get('ticket_id')} - {ticket.get('customer')} - {ticket.get('issue')}\n"
            response += "\n"
        
        if medium:
            response += "🟡 **MEDIUM PRIORITY:**\n"
            for ticket in medium:
                response += f"• {ticket.get('ticket_id')} - {ticket.get('customer')} - {ticket.get('issue')}\n"
            response += "\n"
        
        if low:
            response += "🟢 **LOW PRIORITY:**\n"
            for ticket in low:
                response += f"• {ticket.get('ticket_id')} - {ticket.get('customer')} - {ticket.get('issue')}\n"
        
        return response
    except Exception as e:
        logger.error(f"❌ Error getting support tickets: {e}")
        return f"Error getting support tickets: {str(e)}"

async def main():
    """Run the tests"""
    print("🧪 Testing Agent Tools Directly\n")
    
    # Test 1: Get all inventory
    print("=" * 50)
    print("TEST 1: Get All Inventory")
    print("=" * 50)
    result1 = await test_get_all_inventory()
    print(result1)
    
    # Test 2: Search for diesel
    print("\n" + "=" * 50)
    print("TEST 2: Search for 'diesel'")
    print("=" * 50)
    result2 = await test_search_inventory("diesel")
    print(result2)
    
    # Test 3: Get all support tickets
    print("\n" + "=" * 50)
    print("TEST 3: Get All Support Tickets")
    print("=" * 50)
    result3 = await test_get_all_support_tickets()
    print(result3)
    
    # Test 4: Search for urgent tickets
    print("\n" + "=" * 50)
    print("TEST 4: Search for 'urgent' tickets")
    print("=" * 50)
    result4 = await test_search_support_tickets("urgent")
    print(result4)
    
    # Test 5: Search for delivery delay tickets
    print("\n" + "=" * 50)
    print("TEST 5: Search for 'delivery delay' tickets")
    print("=" * 50)
    result5 = await test_search_support_tickets("delivery delay")
    print(result5)

if __name__ == "__main__":
    asyncio.run(main())