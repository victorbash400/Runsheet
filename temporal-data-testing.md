# Temporal Data Testing Plan

## Overview
Implement time-based data ingestion to test how the logistics platform reacts to operational changes throughout a day.

## Current State
- Static seeded data (development only)
- Single snapshot in time
- No way to simulate operational changes

## Goal
Create two datasets representing different time periods to simulate real operational changes and test system responsiveness.

## Implementation Plan

### 1. Create Time-Shifted Datasets

**Dataset 1: Morning Operations (9:00 AM)**
- All trucks on time
- Full inventory levels
- Minimal support tickets
- Orders in normal flow

**Dataset 2: Afternoon Operations (2:00 PM)**  
- Some trucks delayed (traffic, issues)
- Inventory consumed/depleted
- New support tickets created
- Order status changes (delivered/new orders)

### 2. Data Ingestion Strategy

**Batch Processing**
- Add `ingestion_timestamp` to all documents
- Add `batch_id` for tracking data sources
- Implement upsert logic (update existing, insert new)

**Conflict Resolution**
- Latest timestamp wins for same document ID
- Preserve data lineage
- Track changes for audit

### 3. Expected System Changes

**Analytics Dashboard**
- Performance metrics change over time
- Charts show trends (improvement/decline)
- Real-time KPI updates

**AI Agent Responses**
- "Show delayed trucks" returns different results
- "Inventory status" reflects consumption
- "Any urgent tickets?" shows new issues

**Reports**
- Operations reports show current state
- Performance analysis reflects changes
- Incident analysis correlates events

### 4. Testing Workflow

1. **Baseline Test**
   - Upload Dataset 1 (morning)
   - Query AI agent for baseline responses
   - Generate reports for comparison

2. **Change Simulation**
   - Upload Dataset 2 (afternoon)
   - Same queries should return updated data
   - Reports should reflect operational changes

3. **Validation**
   - Verify all components show updated data
   - Confirm AI agent uses latest information
   - Check analytics reflect temporal changes

### 5. Technical Requirements

**Backend Changes**
- Modify data seeder for batch processing
- Add timestamp-based data management
- Implement data versioning

**Frontend Updates**
- Show data freshness indicators
- Display last update timestamps
- Handle real-time data updates

**Database Schema**
- Add metadata fields (source, batch, timestamp)
- Implement data retention policies
- Create change tracking

## Success Criteria

✅ System reflects operational changes in real-time  
✅ AI agent provides current, accurate information  
✅ Analytics dashboard shows temporal trends  
✅ Reports generate based on latest data  
✅ All components stay synchronized  

## Next Steps (Tomorrow)

1. Create two time-shifted JSON datasets
2. Modify data seeder for batch processing
3. Add timestamp tracking to Elasticsearch
4. Test data ingestion and system response
5. Validate AI agent uses updated information

---

*This will transform the platform from static demo to dynamic operational tool.*