#!/usr/bin/env python3
"""
Test the fallback mechanism in search_support_tickets
"""

import asyncio
import logging
from services.elasticsearch_service import elasticsearch_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_fallback():
    """Test the fallback mechanism"""
    
    print("🧪 Testing Fallback Mechanism")
    print("=" * 40)
    
    try:
        # Get all tickets directly
        print("\n📋 Getting all tickets directly...")
        all_tickets = await elasticsearch_service.get_all_documents("support_tickets")
        print(f"Found {len(all_tickets)} tickets")
        
        for ticket in all_tickets:
            print(f"  - {ticket.get('ticket_id')}: {ticket.get('issue')}")
        
        # Test manual filtering (what the fallback does)
        print("\n🔍 Testing manual filtering for 'TKT-001'...")
        query = "TKT-001"
        filtered = [ticket for ticket in all_tickets if 
                   query.lower() in ticket.get('issue', '').lower() or 
                   query.lower() in ticket.get('description', '').lower() or
                   query.lower() in ticket.get('ticket_id', '').lower()]
        
        print(f"Manual filter found {len(filtered)} tickets")
        for ticket in filtered:
            print(f"  - {ticket.get('ticket_id')}: {ticket.get('issue')}")
        
        # Test semantic search return value
        print("\n🔍 Testing semantic search return...")
        semantic_results = await elasticsearch_service.semantic_search("support_tickets", "TKT-001", ["issue", "description"], 5)
        print(f"Semantic search returned: {semantic_results}")
        print(f"Type: {type(semantic_results)}")
        print(f"Length: {len(semantic_results) if semantic_results else 'None'}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_fallback())