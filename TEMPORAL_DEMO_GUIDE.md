# Temporal Data Demo Guide

## Overview
This demo showcases how the Runsheet Logistics Platform handles real-time operational data updates throughout the day, simulating data from IoT devices, field reports, and external systems.

## Demo Flow

### 1. Morning Baseline (Automatic)
**What happens:** System starts with clean morning operations data
- All trucks on schedule
- Full inventory levels  
- Minimal support tickets
- Fresh orders in transit

**How to reset:**
```bash
cd Runsheet-backend
python cleanup_data.py
```

### 2. Afternoon Operations Update (Manual Upload)
**Scenario:** "IoT sensors and field teams report afternoon updates"

**Steps:**
1. Go to Data Upload component in frontend
2. Select "CSV File" method
3. Set Batch ID to "Afternoon Operations" 
4. Set Operational Time to "2:00 PM"
5. Upload files from `demo-data/` folder:
   - `afternoon_fleet.csv` (trucks delayed, status changes)
   - `afternoon_inventory.csv` (consumed stock, low alerts)
   - `afternoon_support.csv` (new tickets from delays)

**OR use Quick Demo:**
- Click "📊 Simulate Afternoon Data" button for instant demo

**Expected Changes:**
- Fleet: GI-58A shows as delayed due to traffic
- Inventory: Stock levels decreased, some items low/out of stock
- Support: New tickets for delays and inventory alerts
- Analytics: Performance metrics reflect operational challenges

### 3. Evening Operations Update (Manual Upload)
**Scenario:** "End-of-day reports and shift change data"

**Steps:**
1. Set Batch ID to "Evening Operations"
2. Set Operational Time to "5:00 PM" 
3. Upload evening files:
   - `evening_fleet.csv` (deliveries completed, trucks returning, night shift starting)
   - `evening_inventory.csv` (further stock depletion, new safety items)
   - `evening_support.csv` (tickets resolved, new urgent requests)
   - `evening_orders.csv` (deliveries completed, new orders for next day)

**OR use Quick Demo:**
- Click "🌅 Simulate Evening Data" button for instant demo

**Expected Changes:**
- Fleet: Deliveries completed, trucks repositioning, night operations starting
- Inventory: More items consumed, some out of stock, new safety items tracked
- Support: Some tickets resolved, new urgent requests for next day
- Orders: Delivery completions and new bookings for tomorrow
- System shows complete operational cycle progression

### 4. Night Shift Operations (Optional)
**Scenario:** "24/7 operations - night shift data"

**Steps:**
1. Set Batch ID to "Night Shift"
2. Set Operational Time to "11:00 PM"
3. Upload `night_fleet.csv`
   - Night deliveries for morning markets
   - Driver rest periods (compliance)
   - 24/7 operational coverage

**OR use Quick Demo:**
- Click "🌙 Simulate Night Shift" button for instant demo

**Expected Changes:**
- Demonstrates round-the-clock logistics operations
- Shows driver compliance (rest periods)
- Night deliveries for time-sensitive cargo

## Demo Script

### Opening
*"This is our logistics platform showing morning operations baseline. All trucks are on schedule, inventory is fully stocked, and we have minimal support issues."*

### Afternoon Update
*"Now let's simulate real-time data coming in from IoT sensors and field teams during afternoon operations."*

**[Upload afternoon data]**

*"Watch how the system immediately reflects operational changes - trucks are delayed due to traffic, inventory is being consumed, and support tickets are automatically generated for issues."*

### AI Interaction
*"Let's ask our AI agent about the current situation:"*
- "What trucks are delayed?"
- "Show me inventory alerts"
- "Any urgent support tickets?"
- "How did performance change since morning?"

### Evening Update
*"Finally, let's see end-of-day reports coming in:"*

**[Upload evening data]**

*"The system now shows completed deliveries, new orders for tomorrow, and the full operational cycle."*

## Key Demo Points

### Real-Time Responsiveness
- Data uploads immediately update all components
- Analytics dashboard shows temporal trends
- AI agent uses latest operational data

### Multiple Data Sources
- CSV uploads simulate IoT sensor data
- Google Sheets simulate field team reports
- Different batch IDs represent various data sources

### Operational Intelligence
- System tracks changes over time
- Performance metrics show operational impact
- Support tickets correlate with operational issues

### Scalability Demonstration
- Easy to add new data sources
- Temporal metadata tracks data lineage
- System handles operational complexity

## Technical Features Demonstrated

1. **Temporal Data Management**
   - Batch processing with metadata
   - Time-based data versioning
   - Operational timestamp tracking

2. **Real-Time Updates**
   - Immediate UI refresh after uploads
   - Live analytics recalculation
   - AI agent context updates

3. **Data Integration**
   - Multiple file format support
   - Flexible data source simulation
   - Automated data transformation

4. **Operational Intelligence**
   - Performance trend analysis
   - Issue correlation and tracking
   - Predictive insights capability

## Troubleshooting

### Data Not Updating
- Check browser console for errors
- Verify CSV format matches expected columns
- Ensure backend is running on port 8000

### Upload Failures
- Confirm file size under 10MB
- Check CSV headers match expected format
- Verify operational time format (HH:MM)

### AI Agent Not Reflecting Changes
- Wait 10-15 seconds after upload
- Try asking specific questions about new data
- Check if Elasticsearch indices updated

## Sample Questions for AI Agent

**After afternoon upload:**
- "Which trucks are currently delayed?"
- "Show me low stock items"
- "What support tickets need attention?"
- "How is our delivery performance today?"

**After evening upload:**
- "What orders were delivered today?"
- "Show me the operational changes since morning"
- "Any new orders for tomorrow?"
- "Generate a daily operations summary"

---

This demo effectively showcases the platform's ability to handle dynamic operational data and provide real-time insights for logistics management.