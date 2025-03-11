from flask import Flask, jsonify, session
from pymongo import MongoClient

app = Flask(__name__)
client = MongoClient("your_mongodb_connection_string")
db = client.your_database

@app.route('/get-profile-pic', methods=['GET'])
def get_profile_pic():
    user_id = session.get("user_id")  # Ensure the user is logged in
    user = db.users.find_one({"_id": user_id})
    if user and "profile_pic" in user:
        return jsonify({"profile_pic": user["profile_pic"]})
    return jsonify({"profile_pic": "default_profile.jpg"})  # Default image

if __name__ == '__main__':
    app.run(debug=True)
