from sqlalchemy import Column,Integer,ForeignKey

from app.database.base import Base

class Enrollment(Base):

    __tablename__="enrollments"

    id=Column(Integer,primary_key=True,index=True)

    learner_id=Column(Integer,ForeignKey("users.id"))

    course_id=Column(Integer,ForeignKey("courses.id"))