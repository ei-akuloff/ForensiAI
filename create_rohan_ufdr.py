"""
Simple multi-format parser test for Rohan Kapoor case
Creates a ZIP file that can be uploaded via UI
"""
import zipfile
import os
import tempfile

# The multi-file data
files_data = [
  {
    "path": "report_data.json",
    "content": """
{
  "device_info": {
    "model": "OnePlus 9 Pro",
    "imei": "358872098765432",
    "os": "Android 13",
    "owner_name": "Rohan Kapoor"
  },
  "extraction_info": {
    "tool": "UFED 4PC v7.5",
    "examiner": "Det. Sharma",
    "date": "2025-09-25T18:45:12Z"
  },
  "contacts": [
    {"name": "Rohan 'R-Kay' Kapoor", "number": "+919876543210", "email": "rkay.hustle@gmail.com"},
    {"name": "Vicky Supplier", "number": "+919988776655", "email": null},
    {"name": "Chotu Runner", "number": "+918877665544", "email": null},
    {"name": "Amit Client", "number": "+917766554433", "email": null},
    {"name": "Priya Pune Party", "number": "+919123456789", "email": null},
    {"name": "Big Boss", "number": "+919990001111", "email": null},
    {"name": "Mom", "number": "+919820098200", "email": null},
    {"name": "Riya College", "number": "+918887776665", "email": null},
    {"name": "Unknown Target", "number": "+917890123456", "email": null},
    {"name": "DJ Sameer", "number": "+919000011111", "email": null}
  ],
  "calls": [
    {"from": "+919988776655", "to": "+919876543210", "datetime": "2025-09-23T19:00:00Z", "duration": 125, "type": "Incoming"},
    {"from": "+919820098200", "to": "+919876543210", "datetime": "2025-09-23T20:10:00Z", "duration": 350, "type": "Incoming"},
    {"from": "+919876543210", "to": "+918887776665", "datetime": "2025-09-24T10:00:00Z", "duration": 180, "type": "Outgoing"},
    {"from": "+919988776655", "to": "+919876543210", "datetime": "2025-09-24T23:15:00Z", "duration": 35, "type": "Incoming"},
    {"from": "+919876543210", "to": "+918877665544", "datetime": "2025-09-24T23:18:00Z", "duration": 25, "type": "Outgoing"},
    {"from": "+917766554433", "to": "+919876543210", "datetime": "2025-09-25T01:30:00Z", "duration": 0, "type": "Missed"},
    {"from": "+919876543210", "to": "+919123456789", "datetime": "2025-09-25T11:05:00Z", "duration": 55, "type": "Outgoing"},
    {"from": "+919990001111", "to": "+919876543210", "datetime": "2025-09-25T14:00:00Z", "duration": 15, "type": "Incoming"},
    {"from": "+917890123456", "to": "+919876543210", "datetime": "2025-09-25T16:20:00Z", "duration": 8, "type": "Incoming"}
  ],
  "messages": [
    {"from": "AM-MYBANK", "to": "+919876543210", "body": "Your OTP for transaction of INR 50,000 is 882145. Do not share.", "timestamp": "2025-09-23T18:05:00Z", "type": "SMS"},
    {"from": "+919820098200", "to": "+919876543210", "body": "Beta, have you had dinner? Don't be late.", "timestamp": "2025-09-23T20:15:00Z", "type": "WhatsApp"},
    {"from": "+919988776655", "to": "+919876543210", "body": "Fresh maal arrived. The usual green and some premium white this time.", "timestamp": "2025-09-24T22:30:10Z", "type": "SMS"},
    {"from": "+919876543210", "to": "+919988776655", "body": "Okay, need 50g green and 10g white. Send Chotu for pickup.", "timestamp": "2025-09-24T22:31:15Z", "type": "SMS"},
    {"from": "+919876543210", "to": "+918877665544", "body": "Vicky's place, usual stuff. Be quick.", "timestamp": "2025-09-24T23:20:00Z", "type": "WhatsApp"},
    {"from": "VM-PIZZA", "to": "+919876543210", "body": "HUNGRY? Get 50% off on your next order. Code: PIZZA50", "timestamp": "2025-09-25T00:10:00Z", "type": "SMS"},
    {"from": "+917766554433", "to": "+919876543210", "body": "R-Kay bhai need 5 units for tonight. Same place near station?", "timestamp": "2025-09-25T01:28:00Z", "type": "SMS"},
    {"from": "+919123456789", "to": "+919876543210", "body": "Hey, that stuff for the Pune party is confirmed. Need 20 pieces. Cash on delivery.", "timestamp": "2025-09-25T10:55:00Z", "type": "WhatsApp"},
    {"from": "+919990001111", "to": "+919876543210", "body": "The big consignment is stuck. Need you to clear the papers. No excuses.", "timestamp": "2025-09-25T13:58:00Z", "type": "Signal"},
    {"from": "+917890123456", "to": "+919876543210", "body": "Payment not received.", "timestamp": "2025-09-25T16:21:00Z", "type": "Telegram"}
  ],
  "locations": [
    {"latitude": "19.0760", "longitude": "72.8777", "timestamp": "2025-09-23T18:00:00Z", "note": "Bandra Kurla Complex"},
    {"latitude": "19.1197", "longitude": "72.8464", "timestamp": "2025-09-24T23:45:00Z", "note": "Lokhandwala Complex"},
    {"latitude": "19.2183", "longitude": "72.9781", "timestamp": "2025-09-25T01:45:00Z", "note": "Near Thane Station West"},
    {"latitude": "19.1895", "longitude": "72.9729", "timestamp": "2025-09-25T11:30:00Z", "note": "Viviana Mall Parking"},
    {"latitude": "19.2367", "longitude": "72.9653", "timestamp": "2025-09-25T15:00:00Z", "note": "Yeoor Hills Entry Point"}
  ]
}
"""
  },
  {
    "path": "comms_log.xml",
    "content": """<?xml version="1.0" encoding="UTF-8"?>
<communications>
  <calls>
    <call timestamp="2025-09-24T23:15:00Z">
      <from>+919988776655</from>
      <to>+919876543210</to>
      <duration>35</duration>
      <type>Incoming</type>
    </call>
    <call timestamp="2025-09-24T23:18:00Z">
      <from>+919876543210</from>
      <to>+918877665544</to>
      <duration>25</duration>
      <type>Outgoing</type>
    </call>
  </calls>
  <messages>
    <message timestamp="2025-09-24T22:30:10Z">
      <from>+919988776655</from>
      <to>+919876543210</to>
      <body>Fresh maal arrived. The usual green and some premium white this time.</body>
      <type>SMS</type>
    </message>
    <message timestamp="2025-09-24T22:31:15Z">
      <from>+919876543210</from>
      <to>+919988776655</to>
      <body>Okay, need 50g green and 10g white. Send Chotu for pickup.</body>
      <type>SMS</type>
    </message>
  </messages>
</communications>"""
  },
  {
    "path": "notes.txt",
    "content": """Meeting notes:

- V: 50 green, 10 white. Usual drop point.
- A: 5 units, Thane station. Cash.
- P: 20 pcs for Pune. Advance pending.
- BB: Consignment papers. Urgent.

Accounts:
- Amit: 15k due
- Priya: 40k advance

New contact: 7890123456 - payment follow up needed.
"""
  }
]

print("="*70)
print("CREATING ROHAN KAPOOR MULTI-FORMAT UFDR FILE")
print("="*70)

output_file = "rohan_kapoor_drugcase.ufdr"

# Create ZIP file
with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for file_data in files_data:
        zipf.writestr(file_data['path'], file_data['content'].strip())
        print(f"✅ Added: {file_data['path']}")

print(f"\n✅ Created: {output_file}")
print(f"\nFile size: {os.path.getsize(output_file)} bytes")
print(f"\nYou can now upload this file via the dashboard UI at:")
print(f"http://localhost:3000/dashboard")
print(f"\nExpected results:")
print(f"- Messages: 10 from JSON + 2 from XML = 12 messages (after deduplication)")
print(f"- Calls: 9 from JSON + 2 from XML = 11 calls (after deduplication)")
print(f"- Locations: 5 locations")
print(f"- Contact names should be resolved automatically")
