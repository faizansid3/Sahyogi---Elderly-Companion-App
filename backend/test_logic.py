from datetime import datetime
import time

def test_missed_logic(time_str):
    # Mocking the logic in routes.py
    now = datetime.now()
    current_minutes = now.hour * 60 + now.minute
    
    time_str_clean = time_str.upper().replace(" ", "")
    try:
        dt = datetime.strptime(time_str_clean, "%I:%M%p")
        med_minutes = dt.hour * 60 + dt.minute
        
        diff = current_minutes - med_minutes
        is_missed = current_minutes > (med_minutes + 5)
        
        print(f"Current: {now.strftime('%I:%M %p')} ({current_minutes}m)")
        print(f"Scheduled: {time_str} ({med_minutes}m)")
        print(f"Diff: {diff} minutes")
        print(f"Result: {'MISSED' if is_missed else 'PENDING'}")
        return is_missed
    except Exception as e:
        print(f"Error parsing {time_str}: {e}")
        return False

print("--- Test 1: Medicine in the past (10 mins) ---")
test_time = (datetime.now().hour * 60 + datetime.now().minute - 10)
h = test_time // 60
m = test_time % 60
ampm = "AM" if h < 12 else "PM"
h = h % 12
if h == 0: h = 12
time_str = f"{h:02d}:{m:02d} {ampm}"
test_missed_logic(time_str)

print("\n--- Test 2: Medicine in the future ---")
test_time = (datetime.now().hour * 60 + datetime.now().minute + 10)
h = test_time // 60
m = test_time % 60
ampm = "AM" if h < 12 else "PM"
h = h % 12
if h == 0: h = 12
time_str = f"{h:02d}:{m:02d} {ampm}"
test_missed_logic(time_str)
