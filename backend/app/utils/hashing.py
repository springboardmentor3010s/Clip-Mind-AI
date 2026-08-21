from passlib.context import CryptContext

# Create a password hashing context using bcrypt
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# Convert plain password into hashed password
def hash_password(password: str):
    return pwd_context.hash(password)

# Verify entered password with stored hashed password
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)