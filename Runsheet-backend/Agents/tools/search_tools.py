"""
Search tools for the logistics agent
"""

import logging
from strands import tool
from services.elasticsearch_service import elasticsearch_service

logger = logging.getLogger(__name__)

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
        
        # First try semantic search
        try:
            results = await elasticsearch_service.semantic_search("support_tickets", query, ["issue", "description"], 5)
        except Exception as search_error:
            logger.warning(f"Semantic search failed, trying get_all_documents: {search_error}")
            # Fallback to get all and filter
            all_tickets = await elasticsearch_service.get_all_documents("support_tickets")
            if query.lower() in ["all", "all support tickets", "support tickets"]:
                results = all_tickets
            else:
                results = [ticket for ticket in all_tickets if 
                          query.lower() in ticket.get('issue', '').lower() or 
                          query.lower() in ticket.get('description', '').lower() or
                          query.lower() in ticket.get('ticket_id', '').lower()]
        
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
async def search_inventory(query: str) -> str:
    """
    Search inventory items using semantic search.
    
    Args:
        query: Natural language query (e.g., "diesel fuel", "brake parts", "low stock items")
    
    Returns:
        Matching inventory items with stock levels and locations
    """
    try:
        logger.info(f"📦 Searching inventory for: {query}")
        
        # First try semantic search
        try:
            results = await elasticsearch_service.semantic_search("inventory", query, ["name"], 10)
        except Exception as search_error:
            logger.warning(f"Semantic search failed, trying get_all_documents: {search_error}")
            # Fallback to get all and filter
            all_items = await elasticsearch_service.get_all_documents("inventory")
            results = [item for item in all_items if query.lower() in item.get('name', '').lower()]
        
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
        logger.error(f"Error searching inventory: {e}")
        return f"Error searching inventory: {str(e)}"