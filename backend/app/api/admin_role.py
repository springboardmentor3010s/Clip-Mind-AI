from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.role import Role

router = APIRouter(
    prefix="/admin",
    tags=["Admin Role Management"]
)


# ==========================================
# Get All Users
# ==========================================

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db)
):

    users = (
        db.query(User)
        .join(Role)
        .all()
    )

    result = []

    for user in users:

        result.append({

            "id": user.id,

            "name": user.name,

            "email": user.email,

            "role_id": user.role_id,

            "role": user.role.role_name

        })

    return {
        "success": True,
        "count": len(result),
        "users": result
    }


# ==========================================
# Get All Roles
# ==========================================

@router.get("/roles")
def get_roles(
    db: Session = Depends(get_db)
):

    roles = db.query(Role).all()

    return {
        "roles": [
            {
                "id": role.id,
                "role_name": role.role_name
            }
            for role in roles
        ]
    }


# ==========================================
# Change User Role
# ==========================================

@router.put("/change-role/{user_id}")
def change_role(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    role = (
        db.query(Role)
        .filter(Role.id == role_id)
        .first()
    )

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    user.role_id = role_id

    db.commit()
    db.refresh(user)

    return {

        "success": True,

        "message": "User role updated successfully",

        "user": {

            "id": user.id,

            "name": user.name,

            "email": user.email,

            "role": role.role_name

        }

    }


# ==========================================
# Get User By ID
# ==========================================

@router.get("/user/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .join(Role)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {

        "id": user.id,

        "name": user.name,

        "email": user.email,

        "role_id": user.role_id,

        "role": user.role.role_name

    }