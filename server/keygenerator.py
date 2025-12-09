# keygenerator.py
#
# Jason Albanus Virginia Tech August 22, 2025
#
# Utility script to generate encryption keys for Fernet symmetric encryption used in database operations.
#

from cryptography.fernet import Fernet

key = Fernet.generate_key()
print(key.decode())  
