#!/usr/bin/env python3
"""
Test script to check if support ticket search tool works
"""

import asyncio
import logging
from services.elasticsearch_service import elasticsearch_service
from Agents.tools.search_tools import search_support_tickets

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_support_tickets():
    """Test support ticket search functionality"""
    
    print("🧪 Testing Support Ticket Search Tool")
    print("=" * 50)
    
    try:
        # Test 1: Check if support_tickets index exists and has data
        print("\n📋 Test 1: Checking support_tickets index...")
        all_tickets = await elasticsearch_service.get_all_documents("support_tickets")
        print(f"Found {len(all_tickets)} support tickets in index")
        
        if len(all_tickets) > 0:
            print("Sample tickets:")
            for i, ticket in enumerate(all_tickets[:3]):
                print(f"  {i+1}. {ticket.get('ticket_id')} - {ticket.get('issue')}")
        else:
            print("❌ No support tickets found in index!")
            return
        
        # Test 2: Test semantic search directly
        print("\n🔍 Test 2: Testing semantic search...")
        search_results = await elasticsearch_service.semantic_search(
            "support_tickets", 
            "TKT-001", 
            ["issue", "description"], 
            5
        )
        print(f"Semantic search for 'TKT-001' returned {len(search_results)} results")
        
        # Test 3: Test the actual tool
        print("\n🛠️ Test 3: Testing search_support_tickets tool...")
        tool_result = await search_support_tickets("TKT-001")
        print("Tool result:")
        print(tool_result)
        
        # Test 4: Test with different queries
        print("\n🔍 Test 4: Testing different queries...")
        queries = ["all tickets", "delivery", "urgent", "open"]
        
        for query in queries:
            print(f"\nQuery: '{query}'")
            result = await search_support_tickets(query)
            print(f"Result length: {len(result)} characters")
            if "No support tickets found" in result:
                print("❌ No results found")
            else:
                print("✅ Results found")
        
        print("\n" + "=" * 50)
        print("🎉 Support ticket search test completed!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        logger.error(f"Test error: {e}")

if __name__ == "__main__":
    asyncio.run(test_support_tickets())