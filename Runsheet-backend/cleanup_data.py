#!/usr/bin/env python3
"""
Elasticsearch Data Cleanup Script
Clears duplicate data and reseeds with fresh data
"""

import asyncio
import logging
import sys
from services.data_seeder import data_seeder

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def main():
    """Main cleanup function"""
    try:
        print("🧹 Starting Elasticsearch data cleanup...")
        print("=" * 50)
        
        # Clear all existing data
        print("🗑️  Step 1: Clearing existing data...")
        await data_seeder.clear_all_data()
        print("✅ Existing data cleared")
        
        # Reseed with fresh data
        print("\n🌱 Step 2: Reseeding with fresh data...")
        await data_seeder.seed_all_data(force=True)
        print("✅ Fresh data seeded")
        
        print("\n" + "=" * 50)
        print("🎉 Cleanup completed successfully!")
        print("📊 Your Elasticsearch indices now have clean, unique data")
        print("🔄 Restart your frontend to see the changes")
        
    except Exception as e:
        logger.error(f"❌ Cleanup failed: {e}")
        print(f"\n💥 Error during cleanup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Runsheet Logistics - Data Cleanup Script")
    print("This will clear all existing data and reseed with fresh data.")
    
    # Confirm with user
    confirm = input("\nDo you want to continue? (y/N): ").lower().strip()
    if confirm not in ['y', 'yes']:
        print("❌ Cleanup cancelled")
        sys.exit(0)
    
    # Run cleanup
    asyncio.run(main())