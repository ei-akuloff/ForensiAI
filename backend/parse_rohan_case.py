"""
Parse multi-format UFDR bundle (Rohan Kapoor drug case)
This demonstrates parsing JSON + XML + CSV + TXT + HTML files
"""
import asyncio
import json
import sys
import os
import tempfile
import shutil

# The multi-file data
files_data = [
  {
    "path": "report_data.json",
    "content": "{\n  \"device_info\": {\n    \"model\": \"OnePlus 9 Pro\",\n    \"imei\": \"358872098765432\",\n    \"os\": \"Android 13\",\n    \"owner_name\": \"Rohan Kapoor\"\n  },\n  \"extraction_info\": {\n    \"tool\": \"UFED 4PC v7.5\",\n    \"examiner\": \"Det. Sharma\",\n    \"date\": \"2025-09-25T18:45:12Z\"\n  },\n  \"contacts\": [\n    {\"name\": \"Rohan 'R-Kay' Kapoor\", \"number\": \"+919876543210\", \"email\": \"rkay.hustle@gmail.com\"},\n    {\"name\": \"Vicky Supplier\", \"number\": \"+919988776655\", \"email\": null},\n    {\"name\": \"Chotu Runner\", \"number\": \"+918877665544\", \"email\": null},\n    {\"name\": \"Amit Client\", \"number\": \"+917766554433\", \"email\": null},\n    {\"name\": \"Priya Pune Party\", \"number\": \"+919123456789\", \"email\": null},\n    {\"name\": \"Big Boss\", \"number\": \"+919990001111\", \"email\": null},\n    {\"name\": \"Mom\", \"number\": \"+919820098200\", \"email\": null},\n    {\"name\": \"Riya College\", \"number\": \"+918887776665\", \"email\": null},\n    {\"name\": \"Unknown Target\", \"number\": \"+917890123456\", \"email\": null},\n    {\"name\": \"DJ Sameer\", \"number\": \"+919000011111\", \"email\": null}\n  ],\n  \"calls\": [\n    {\"from\": \"+919988776655\", \"to\": \"+919876543210\", \"datetime\": \"2025-09-23T19:00:00Z\", \"duration\": 125, \"type\": \"Incoming\"},\n    {\"from\": \"+919820098200\", \"to\": \"+919876543210\", \"datetime\": \"2025-09-23T20:10:00Z\", \"duration\": 350, \"type\": \"Incoming\"},\n    {\"from\": \"+919876543210\", \"to\": \"+918887776665\", \"datetime\": \"2025-09-24T10:00:00Z\", \"duration\": 180, \"type\": \"Outgoing\"},\n    {\"from\": \"+919988776655\", \"to\": \"+919876543210\", \"datetime\": \"2025-09-24T23:15:00Z\", \"duration\": 35, \"type\": \"Incoming\"},\n    {\"from\": \"+919876543210\", \"to\": \"+918877665544\", \"datetime\": \"2025-09-24T23:18:00Z\", \"duration\": 25, \"type\": \"Outgoing\"},\n    {\"from\": \"+917766554433\", \"to\": \"+919876543210\", \"datetime\": \"2025-09-25T01:30:00Z\", \"duration\": 0, \"type\": \"Missed\"},\n    {\"from\": \"+919876543210\", \"to\": \"+919123456789\", \"datetime\": \"2025-09-25T11:05:00Z\", \"duration\": 55, \"type\": \"Outgoing\"},\n    {\"from\": \"+919990001111\", \"to\": \"+919876543210\", \"datetime\": \"2025-09-25T14:00:00Z\", \"duration\": 15, \"type\": \"Incoming\"},\n    {\"from\": \"+917890123456\", \"to\": \"+919876543210\", \"datetime\": \"2025-09-25T16:20:00Z\", \"duration\": 8, \"type\": \"Incoming\"}\n  ],\n  \"messages\": [\n    {\"from\": \"AM-MYBANK\", \"to\": \"+919876543210\", \"body\": \"Your OTP for transaction of INR 50,000 is 882145. Do not share.\", \"timestamp\": \"2025-09-23T18:05:00Z\", \"type\": \"SMS\"},\n    {\"from\": \"+919820098200\", \"to\": \"+919876543210\", \"body\": \"Beta, have you had dinner? Don't be late.\", \"timestamp\": \"2025-09-23T20:15:00Z\", \"type\": \"WhatsApp\"},\n    {\"from\": \"+919988776655\", \"to\": \"+919876543210\", \"body\": \"Fresh maal arrived. The usual green and some premium white this time.\", \"timestamp\": \"2025-09-24T22:30:10Z\", \"type\": \"SMS\"},\n    {\"from\": \"+919876543210\", \"to\": \"+919988776655\", \"body\": \"Okay, need 50g green and 10g white. Send Chotu for pickup.\", \"timestamp\": \"2025-09-24T22:31:15Z\", \"type\": \"SMS\"},\n    {\"from\": \"+919876543210\", \"to\": \"+918877665544\", \"body\": \"Vicky's place, usual stuff. Be quick.\", \"timestamp\": \"2025-09-24T23:20:00Z\", \"type\": \"WhatsApp\"},\n    {\"from\": \"VM-PIZZA\", \"to\": \"+919876543210\", \"body\": \"HUNGRY? Get 50% off on your next order. Code: PIZZA50\", \"timestamp\": \"2025-09-25T00:10:00Z\", \"type\": \"SMS\"},\n    {\"from\": \"+917766554433\", \"to\": \"+919876543210\", \"body\": \"R-Kay bhai need 5 units for tonight. Same place near station?\", \"timestamp\": \"2025-09-25T01:28:00Z\", \"type\": \"SMS\"},\n    {\"from\": \"+919123456789\", \"to\": \"+919876543210\", \"body\": \"Hey, that stuff for the Pune party is confirmed. Need 20 pieces. Cash on delivery.\", \"timestamp\": \"2025-09-25T10:55:00Z\", \"type\": \"WhatsApp\"},\n    {\"from\": \"+919990001111\", \"to\": \"+919876543210\", \"body\": \"The big consignment is stuck. Need you to clear the papers. No excuses.\", \"timestamp\": \"2025-09-25T13:58:00Z\", \"type\": \"Signal\"},\n    {\"from\": \"+917890123456\", \"to\": \"+919876543210\", \"body\": \"Payment not received.\", \"timestamp\": \"2025-09-25T16:21:00Z\", \"type\": \"Telegram\"}\n  ],\n  \"locations\": [\n    {\"latitude\": \"19.0760\", \"longitude\": \"72.8777\", \"timestamp\": \"2025-09-23T18:00:00Z\", \"note\": \"Bandra Kurla Complex\"},\n    {\"latitude\": \"19.1197\", \"longitude\": \"72.8464\", \"timestamp\": \"2025-09-24T23:45:00Z\", \"note\": \"Lokhandwala Complex\"},\n    {\"latitude\": \"19.2183\", \"longitude\": \"72.9781\", \"timestamp\": \"2025-09-25T01:45:00Z\", \"note\": \"Near Thane Station West\"},\n    {\"latitude\": \"19.1895\", \"longitude\": \"72.9729\", \"timestamp\": \"2025-09-25T11:30:00Z\", \"note\": \"Viviana Mall Parking\"},\n    {\"latitude\": \"19.2367\", \"longitude\": \"72.9653\", \"timestamp\": \"2025-09-25T15:00:00Z\", \"note\": \"Yeoor Hills Entry Point\"}\n  ],\n  \"browser_history\": [\n      {\"url\": \"https://www.indiamart.com/proddetail/synthesis-of-mephedrone-22785195191.html\", \"title\": \"Synthesis of Mephedrone - IndiaMart\", \"timestamp\": \"2025-09-23T14:10:21Z\"},\n      {\"url\": \"https://www.google.com/search?q=how+to+clean+phone+data+remotely\", \"title\": \"how to clean phone data remotely - Google Search\", \"timestamp\": \"2025-09-24T09:30:05Z\"},\n      {\"url\": \"https://timesofindia.indiatimes.com/city/mumbai/mumbai-drug-bust-ncb-seizes-50-crore-worth-of-mdma/articleshow/94123456.cms\", \"title\": \"Mumbai Drug Bust: NCB seizes 50 crore... - Times of India\", \"timestamp\": \"2025-09-25T08:00:15Z\"},\n      {\"url\": \"https://www.zomato.com/mumbai/biryani-near-me\", \"title\": \"Biryani Near Me - Zomato\", \"timestamp\": \"2025-09-25T12:30:45Z\"}\n  ],\n  \"installed_apps\": [\n      {\"name\": \"WhatsApp\", \"package_name\": \"com.whatsapp\", \"install_date\": \"2023-01-15\"},\n      {\"name\": \"Signal\", \"package_name\": \"org.thoughtcrime.securesms\", \"install_date\": \"2024-05-20\"},\n      {\"name\": \"Telegram\", \"package_name\": \"org.telegram.messenger\", \"install_date\": \"2024-02-11\"},\n      {\"name\": \"Instagram\", \"package_name\": \"com.instagram.android\", \"install_date\": \"2023-01-15\"},\n      {\"name\": \"Calculator%\", \"package_name\": \"com.hide.calculator.vault\", \"install_date\": \"2024-08-01\"},\n      {\"name\": \"PayTM\", \"package_name\": \"net.one97.paytm\", \"install_date\": \"2023-02-22\"}\n  ],\n  \"wifi_networks\": [\n      {\"ssid\": \"RohanHome5G\", \"bssid\": \"1A:2B:3C:4D:5E:6F\", \"last_connected\": \"2025-09-25T18:00:00Z\"},\n      {\"ssid\": \"Starbucks_Free\", \"bssid\": \"F1:E2:D3:C4:B5:A6\", \"last_connected\": \"2025-09-25T11:25:00Z\"},\n      {\"ssid\": \"TheBackAlley\", \"bssid\": \"AA:BB:CC:DD:EE:FF\", \"last_connected\": \"2025-09-25T01:40:00Z\"}\n  ]\n}"
  },
  {
    "path": "comms_log.xml",
    "content": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<communications>\n  <calls>\n    <call timestamp=\"2025-09-24T23:15:00Z\">\n      <from>+919988776655</from>\n      <to>+919876543210</to>\n      <duration>35</duration>\n      <type>Incoming</type>\n    </call>\n    <call timestamp=\"2025-09-24T23:18:00Z\">\n      <from>+919876543210</from>\n      <to>+918877665544</to>\n      <duration>25</duration>\n      <type>Outgoing</type>\n    </call>\n  </calls>\n  <messages>\n    <message timestamp=\"2025-09-24T22:30:10Z\">\n      <from>+919988776655</from>\n      <to>+919876543210</to>\n      <body>Fresh maal arrived. The usual green and some premium white this time.</body>\n      <type>SMS</type>\n    </message>\n    <message timestamp=\"2025-09-24T22:31:15Z\">\n      <from>+919876543210</from>\n      <to>+919988776655</to>\n      <body>Okay, need 50g green and 10g white. Send Chotu for pickup.</body>\n      <type>SMS</type>\n    </message>\n  </messages>\n</communications>"
  },
  {
    "path": "summary_report.html",
    "content": "<!DOCTYPE html>\n<html>\n<head>\n<title>Case Summary: Rohan Kapoor</title>\n<style>body{font-family:sans-serif; margin: 2em;} h1,h2{color:#333;} .message{border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px;}</style>\n</head>\n<body>\n<h1>Extraction Summary</h1>\n<p><strong>Case ID:</strong> THN-CR-2025-789</p>\n<p><strong>Suspect:</strong> Rohan 'R-Kay' Kapoor</p>\n<h2>Key Contacts</h2>\n<ul>\n  <li>Vicky Supplier (+919988776655)</li>\n  <li>Chotu Runner (+918877665544)</li>\n  <li>Big Boss (+919990001111)</li>\n</ul>\n<h2>Flagged Messages</h2>\n<div class=\"message\">\n  <p><strong>From:</strong> Vicky Supplier (+919988776655)</p>\n  <p><strong>Content:</strong> Fresh maal arrived. The usual green and some premium white this time.</p>\n</div>\n<div class=\"message\">\n  <p><strong>From:</strong> Big Boss (+919990001111)</p>\n  <p><strong>Content:</strong> The big consignment is stuck. Need you to clear the papers. No excuses.</p>\n</div>\n</body>\n</html>"
  },
  {
    "path": "browser_history.csv",
    "content": "timestamp,url,title\n2025-09-23T14:10:21Z,https://www.indiamart.com/proddetail/synthesis-of-mephedrone-22785195191.html,Synthesis of Mephedrone - IndiaMart\n2025-09-24T09:30:05Z,https://www.google.com/search?q=how+to+clean+phone+data+remotely,how to clean phone data remotely - Google Search\n2025-09-25T08:00:15Z,https://timesofindia.indiatimes.com/city/mumbai/mumbai-drug-bust-ncb-seizes-50-crore-worth-of-mdma/articleshow/94123456.cms,Mumbai Drug Bust: NCB seizes 50 crore... - Times of India\n2025-09-25T12:30:45Z,https://www.zomato.com/mumbai/biryani-near-me,Biryani Near Me - Zomato\n"
  },
  {
    "path": "notes.txt",
    "content": "Meeting notes:\n\n- V: 50 green, 10 white. Usual drop point.\n- A: 5 units, Thane station. Cash.\n- P: 20 pcs for Pune. Advance pending.\n- BB: Consignment papers. Urgent.\n\nAccounts:\n- Amit: 15k due\n- Priya: 40k advance\n\nNew contact: 7890123456 - payment follow up needed.\n"
  }
]

async def main():
    from motor.motor_asyncio import AsyncIOMotorClient
    
    print("="*70)
    print("MULTI-FORMAT UFDR PARSING TEST - Rohan Kapoor Drug Case")
    print("="*70)
    
    # Create temp directory and write files
    temp_dir = tempfile.mkdtemp()
    print(f"\n1. Creating temporary directory: {temp_dir}")
    
    try:
        for file_data in files_data:
            file_path = os.path.join(temp_dir, file_data['path'])
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(file_data['content'])
            print(f"   ✅ Created: {file_data['path']}")
        
        # Import multi-format parser
        sys.path.insert(0, '.')
        from multi_format_parser import parse_multi_format_ufdr
        import forensic_parser
        
        # Parse all formats
        print(f"\n2. Parsing multi-format UFDR bundle...")
        multi_data = parse_multi_format_ufdr(temp_dir)
        
        print(f"\n3. Multi-format parsing results:")
        print(f"   - Calls: {len(multi_data.get('calls', []))}")
        print(f"   - Messages: {len(multi_data.get('messages', []))}")
        print(f"   - Locations: {len(multi_data.get('locations', []))}")
        print(f"   - Contacts: {len(multi_data.get('contacts', []))}")
        
        # Convert to forensic format
        print(f"\n4. Converting to forensic format...")
        forensic_data = forensic_parser.parse_all_forensic_data(multi_data)
        
        print(f"\n5. Forensic parsing results:")
        print(f"   - Messenger Messages: {len(forensic_data['messenger_messages'])}")
        print(f"   - Call Logs: {len(forensic_data['call_logs'])}")
        print(f"   - Locations: {len(forensic_data['find_my_locations'])}")
        
        # Show sample data
        if forensic_data['messenger_messages']:
            print(f"\n6. Sample Messages (showing first 5):")
            for i, msg in enumerate(forensic_data['messenger_messages'][:5], 1):
                print(f"   Message {i}:")
                print(f"      From: {msg['sender']}")
                print(f"      To: {msg['receiver']}")
                print(f"      Content: {msg['content'][:60]}...")
                print(f"      App: {msg['app_name']}")
                print(f"      Time: {msg['timestamp']}")
        
        if forensic_data['call_logs']:
            print(f"\n7. Sample Call Logs (showing first 5):")
            for i, call in enumerate(forensic_data['call_logs'][:5], 1):
                print(f"   Call {i}:")
                print(f"      Contact: {call.get('contact_name', 'Unknown')} ({call['phone_number']})")
                print(f"      Type: {call['call_type']}")
                print(f"      Duration: {call['duration_seconds']}s")
                print(f"      Time: {call['timestamp']}")
        
        # Store in MongoDB
        session_id = input("\n\nEnter session_id to store data (or press Enter to skip): ").strip()
        
        if session_id:
            case_id = input("Enter case_id (MongoDB ObjectId or any ID): ").strip()
            
            client = AsyncIOMotorClient('mongodb://localhost:27017/')
            db = client.ufdr_investigation
            
            print(f"\n8. Storing in MongoDB...")
            
            # Store messages
            if forensic_data['messenger_messages']:
                messages_to_store = []
                for msg in forensic_data['messenger_messages']:
                    doc = {**msg, 'session_id': session_id, 'case_id': case_id}
                    messages_to_store.append(doc)
                
                result = await db.messenger_messages.insert_many(messages_to_store)
                print(f"   ✅ Stored {len(result.inserted_ids)} messages")
            
            # Store call logs
            if forensic_data['call_logs']:
                calls_to_store = []
                for call in forensic_data['call_logs']:
                    doc = {**call, 'session_id': session_id, 'case_id': case_id}
                    calls_to_store.append(doc)
                
                result = await db.call_logs.insert_many(calls_to_store)
                print(f"   ✅ Stored {len(result.inserted_ids)} call logs")
            
            # Store locations
            if forensic_data['find_my_locations']:
                locations_to_store = []
                for loc in forensic_data['find_my_locations']:
                    doc = {**loc, 'session_id': session_id, 'case_id': case_id}
                    locations_to_store.append(doc)
                
                result = await db.find_my_locations.insert_many(locations_to_store)
                print(f"   ✅ Stored {len(result.inserted_ids)} locations")
            
            print(f"\n✅ SUCCESS! Multi-format data is now in MongoDB.")
            print(f"\nCase URL: http://localhost:3000/cases/{case_id.split('_')[1] if '_' in case_id else case_id}")
            
            client.close()
        else:
            print("\nSkipping MongoDB storage.")
        
    finally:
        # Clean up temp directory
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
            print(f"\n9. Cleaned up temporary directory")

if __name__ == "__main__":
    asyncio.run(main())
