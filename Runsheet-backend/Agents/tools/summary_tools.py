"""
Summary and overview tools for the logistics agent
"""

import logging
from strands import tool
from services.elasticsearch_service import elasticsearch_service

logger = logging.getLogger(__name__)

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
        if total > 0:
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

@tool
async def get_inventory_summary() -> str:
    """
    Get complete inventory summary with all items and stock levels.
    
    Returns:
        All inventory items organized by status
    """
    try:
        logger.info("📦 Getting inventory summary")
        inventory = await elasticsearch_service.get_all_documents("inventory")
        
        if not inventory:
            return "No inventory data found. The inventory might not be seeded yet."
        
        # Group by status
        in_stock = [i for i in inventory if i.get('status') == 'in_stock']
        low_stock = [i for i in inventory if i.get('status') == 'low_stock']
        out_of_stock = [i for i in inventory if i.get('status') == 'out_of_stock']
        
        response = f"📦 **Inventory Summary** ({len(inventory)} total items)\n\n"
        
        if in_stock:
            response += "🟢 **In Stock:**\n"
            for item in in_stock:
                response += f"• {item.get('name')} - {item.get('quantity')} {item.get('unit')} at {item.get('location')}\n"
            response += "\n"
        
        if low_stock:
            response += "🟡 **Low Stock:**\n"
            for item in low_stock:
                response += f"• {item.get('name')} - {item.get('quantity')} {item.get('unit')} at {item.get('location')}\n"
            response += "\n"
        
        if out_of_stock:
            response += "🔴 **Out of Stock:**\n"
            for item in out_of_stock:
                response += f"• {item.get('name')} at {item.get('location')}\n"
        
        return response
    except Exception as e:
        logger.error(f"Error getting inventory summary: {e}")
        return f"Error getting inventory summary: {str(e)}"

@tool
async def get_analytics_overview() -> str:
    """
    Get current analytics and performance metrics overview.
    
    Returns:
        Current KPIs, route performance, and delay analysis
    """
    try:
        logger.info("📊 Getting analytics overview")
        
        # Get current metrics
        metrics = await elasticsearch_service.get_current_metrics()
        routes = await elasticsearch_service.get_route_performance_data()
        delays = await elasticsearch_service.get_delay_causes_data()
        
        response = f"📊 **Analytics Overview**\n\n"
        
        # Current metrics
        response += "**Key Metrics:**\n"
        for key, metric in metrics.items():
            trend_emoji = "📈" if metric.get("trend") == "up" else "📉"
            response += f"• {metric.get('title')}: {metric.get('value')} {trend_emoji}\n"
        
        # Top routes
        response += f"\n**Top Routes:**\n"
        for route in sorted(routes, key=lambda x: x.get('performance', 0), reverse=True)[:3]:
            response += f"• {route.get('name')}: {route.get('performance')}%\n"
        
        # Main delay causes
        response += f"\n**Main Delay Causes:**\n"
        for cause in sorted(delays, key=lambda x: x.get('percentage', 0), reverse=True)[:3]:
            response += f"• {cause.get('name')}: {cause.get('percentage')}%\n"
        
        return response
    except Exception as e:
        logger.error(f"Error getting analytics overview: {e}")
        return f"Error getting analytics overview: {str(e)}"

@tool
async def get_performance_insights() -> str:
    """
    Get performance insights and recommendations.
    
    Returns:
        Analysis of performance issues and improvement suggestions
    """
    try:
        logger.info("🎯 Getting performance insights")
        
        routes = await elasticsearch_service.get_route_performance_data()
        delays = await elasticsearch_service.get_delay_causes_data()
        regions = await elasticsearch_service.get_regional_performance_data()
        
        response = f"🎯 **Performance Insights**\n\n"
        
        # Best and worst routes
        best_route = max(routes, key=lambda x: x.get('performance', 0))
        worst_route = min(routes, key=lambda x: x.get('performance', 0))
        
        response += f"🟢 **Best Route**: {best_route.get('name')} ({best_route.get('performance')}%)\n"
        response += f"🔴 **Needs Attention**: {worst_route.get('name')} ({worst_route.get('performance')}%)\n\n"
        
        # Main delay cause
        main_delay = max(delays, key=lambda x: x.get('percentage', 0))
        response += f"⚠️ **Main Issue**: {main_delay.get('name')} causes {main_delay.get('percentage')}% of delays\n\n"
        
        # Regional performance
        best_region = max(regions, key=lambda x: x.get('onTimePercentage', 0))
        worst_region = min(regions, key=lambda x: x.get('onTimePercentage', 0))
        
        response += f"🌟 **Best Region**: {best_region.get('name')} ({best_region.get('onTimePercentage')}% on-time)\n"
        response += f"📍 **Focus Area**: {worst_region.get('name')} ({worst_region.get('onTimePercentage')}% on-time)\n"
        
        return response
    except Exception as e:
        logger.error(f"Error getting performance insights: {e}")
        return f"Error getting performance insights: {str(e)}"