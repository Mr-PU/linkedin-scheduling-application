from flask import Flask, request, jsonify, redirect, url_for
from flask_cors import CORS
import os
import csv
from datetime import datetime, timedelta
import threading
import time
import logging
from crewai import Agent, Task, Crew, Process
from dotenv import load_dotenv
import requests
import urllib.parse
from threading import Thread
import schedule
import re

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
load_dotenv()

logging.basicConfig(filename='linkedin_agent.log', level=logging.INFO,
                   format='%(asctime)s - %(levelname)s - %(message)s')

# LinkedIn API credentials
LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
REDIRECT_URI = "http://localhost:5000/api/linkedin-callback"

USER_DATA = {}

import openai
openai.api_key = os.getenv("OPENAI_API_KEY")

post_writer = Agent(
    role='Post Writer',
    goal='Generate engaging LinkedIn posts under 3000 characters.',
    backstory='Creative writer for professional social media.',
    verbose=True,
    llm="gpt-4o-mini"
)

POSTS_FILE = 'linkedin_posts.csv'

def initialize_csv():
    if not os.path.exists(POSTS_FILE):
        with open(POSTS_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'content', 'tag', 'scheduled_time', 'posted', 'user_urn'])

def generate_post_variations(prompt=None):
    try:
        prompt_desc = f'Generate 3 creative LinkedIn post variations under 3000 characters' + \
                     (f' based on: "{prompt}"' if prompt else '') + \
                     '. Format as: "1. [post text]", "2. [post text]", "3. [post text]" with each post as a single block.'
        task = Task(description=prompt_desc, agent=post_writer, expected_output='Three post variations as a list')
        crew = Crew(agents=[post_writer], tasks=[task], process=Process.sequential)
        crew.kickoff()
        output = task.output.raw
        logging.info(f"Raw OpenAI output: {output}")
        if isinstance(output, str):

            variations = re.split(r'\d+\.\s*', output)[1:]  # Split on "1. ", "2. ", etc., and skip empty first element
            variations = [var.strip() for var in variations if var.strip()][:3]
        else:
            variations = output[:3]
        while len(variations) < 3:
            variations.append(f"LinkedIn post variation {len(variations) + 1}")
        logging.info(f"Processed variations: {variations}")
        return variations[:3]
    except Exception as e:
        logging.error(f"Error generating posts: {e}")
        return [f"Error generating post {i+1}" for i in range(3)]

def post_to_linkedin(user_urn, content):
    access_token = USER_DATA[user_urn]['access_token']
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
    }
    payload = {
        'author': f'urn:li:person:{user_urn}',
        'lifecycleState': 'PUBLISHED',
        'specificContent': {
            'com.linkedin.ugc.ShareContent': {
                'shareCommentary': {'text': content},
                'shareMediaCategory': 'NONE'
            }
        },
        'visibility': {'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'}
    }
    response = requests.post('https://api.linkedin.com/v2/ugcPosts', headers=headers, json=payload)
    if response.status_code == 201:
        logging.info(f"Successfully posted to LinkedIn for {user_urn}")
    else:
        logging.error(f"Failed to post to LinkedIn for {user_urn}: {response.text}")

def check_and_post_scheduled_posts():
    while True:
        now = datetime.now()
        with open(POSTS_FILE, 'r') as f:
            reader = csv.DictReader(f)
            posts = list(reader)
        with open(POSTS_FILE, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['id', 'content', 'tag', 'scheduled_time', 'posted', 'user_urn'])
            writer.writeheader()
            for post in posts:
                scheduled_time = datetime.strptime(post['scheduled_time'], '%Y-%m-%d %H:%M:%S')
                if now >= scheduled_time and post['posted'] == 'False':
                    user_urn = post['user_urn']
                    access_token = USER_DATA.get(user_urn, {}).get('access_token')
                    if access_token:
                        success, message = post_to_linkedin(post['content'], user_urn, access_token)
                        post['posted'] = 'True' if success else 'False'
                writer.writerow(post)
        time.sleep(900)

# OAuth Endpoints
@app.route('/api/linkedin-login')
def linkedin_login():
    auth_url = (
        "https://www.linkedin.com/oauth/v2/authorization?"
        f"response_type=code&client_id={LINKEDIN_CLIENT_ID}&redirect_uri={urllib.parse.quote(REDIRECT_URI)}"
        "&scope=r_liteprofile%20w_member_social"
    )
    return redirect(auth_url)

# @app.route('/api/linkedin-callback')
# def linkedin_callback():
#     code = request.args.get('code')
#     if not code:
#         return jsonify({'success': False, 'message': 'Authorization failed'}), 400
    
#     token_url = "https://www.linkedin.com/oauth/v2/accessToken"
#     payload = {
#         'grant_type': 'authorization_code',
#         'code': code,
#         'redirect_uri': REDIRECT_URI,
#         'client_id': LINKEDIN_CLIENT_ID,
#         'client_secret': LINKEDIN_CLIENT_SECRET
#     }
#     response = requests.post(token_url, data=payload)
#     if response.status_code != 200:
#         return jsonify({'success': False, 'message': 'Token exchange failed'}), 400
    
#     access_token = response.json().get('access_token')
    
#     profile_url = "https://api.linkedin.com/v2/me"
#     headers = {"Authorization": f"Bearer {access_token}"}
#     profile_response = requests.get(profile_url, headers=headers)
#     if profile_response.status_code != 200:
#         return jsonify({'success': False, 'message': 'Profile fetch failed'}), 400
    
#     user_id = profile_response.json().get('id')
#     user_urn = f"urn:li:person:{user_id}"
#     USER_DATA[user_urn] = {'access_token': access_token}
    
#     return redirect("http://localhost:3000/?authenticated=true")

@app.route('/api/linkedin-callback')
def linkedin_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'No code provided'}), 400
    
    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': LINKEDIN_CLIENT_ID,
        'client_secret': LINKEDIN_CLIENT_SECRET,
    }
    response = requests.post(token_url, data=data)
    token_data = response.json()
    
    access_token = token_data.get('access_token')
    if not access_token:
        return jsonify({'error': 'Failed to get access token'}), 400
    
    # Fetch user profile first to get the correct URN
    profile_url = 'https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,headline)'
    headers = {'Authorization': f'Bearer {access_token}'}
    profile_response = requests.get(profile_url, headers=headers)
    profile_data = profile_response.json()
    
    if profile_response.status_code != 200:
        return jsonify({'error': 'Failed to fetch profile'}), 400
    
    user_urn = profile_data.get('id', f"urn:li:person:{hash(access_token)}")
    first_name = profile_data.get('firstName', {}).get('localized', {}).get('en_US', 'Unknown')
    last_name = profile_data.get('lastName', {}).get('localized', {}).get('en_US', '')
    headline = profile_data.get('headline', {}).get('localized', {}).get('en_US', 'No Designation')
    
    USER_DATA[user_urn] = {
        'access_token': access_token,
        'name': f"{first_name} {last_name}".strip(),
        'designation': headline
    }
    
    logging.info(f"User authenticated: {user_urn}, Name: {USER_DATA[user_urn]['name']}")
    return redirect(f'http://localhost:3000/?authenticated=true&user_urn={user_urn}')

@app.route('/api/me', methods=['GET'])
def get_profile():
    user_urn = request.args.get('user_urn')
    if not user_urn or user_urn not in USER_DATA:
        logging.error(f"Invalid user_urn: {user_urn}")
        return jsonify({'success': False, 'message': 'Invalid user URN'}), 400
    user_data = USER_DATA.get(user_urn, {})
    logging.info(f"Returning profile for {user_urn}: {user_data}")
    return jsonify({
        'name': user_data.get('name', 'Unknown User'),
        'designation': user_data.get('designation', 'No Designation'),
    })

# API Endpoints (unchanged below for brevity)
@app.route('/api/generate-posts', methods=['POST'])
def generate_posts():
    data = request.json
    prompt = data.get('prompt')
    variations = generate_post_variations(prompt)
    return jsonify({'variations': variations})

@app.route('/api/schedule-post', methods=['POST'])
def schedule_post():
    data = request.json
    post_id = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{hash(data['content'])}"
    user_urn = data.get('user_urn')
    if not user_urn or user_urn not in USER_DATA:
        return jsonify({'success': False, 'message': 'Invalid user URN'}), 400
    
    with open(POSTS_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([post_id, data['content'], data['tag'], data['scheduled_time'], 'False', user_urn])
    return jsonify({'message': 'Post scheduled', 'id': post_id})

@app.route('/api/scheduled-posts', methods=['GET'])
def get_scheduled_posts():
    user_urn = request.args.get('user_urn')
    if not user_urn or user_urn not in USER_DATA:
        return jsonify({'success': False, 'message': 'Invalid user URN'}), 400
    
    with open(POSTS_FILE, 'r') as f:
        reader = csv.DictReader(f)
        posts = [row for row in reader if row['posted'] == 'False' and row['user_urn'] == user_urn]
    return jsonify({'posts': posts})

@app.route('/api/cancel-post', methods=['POST'])
def cancel_post():
    data = request.json
    post_id = data.get('id')
    if not post_id:
        return jsonify({'success': False, 'message': 'Post ID required'}), 400
    
    with open(POSTS_FILE, 'r') as f:
        reader = csv.DictReader(f)
        posts = list(reader)
    
    updated_posts = [post for post in posts if post['id'] != post_id]
    if len(updated_posts) == len(posts):
        return jsonify({'success': False, 'message': 'Post not found'}), 404
    
    with open(POSTS_FILE, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['id', 'content', 'tag', 'scheduled_time', 'posted', 'user_urn'])
        writer.writeheader()
        writer.writerows(updated_posts)
    
    logging.info(f"Canceled post with ID: {post_id}")
    return jsonify({'success': True, 'message': 'Post canceled'})

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    user_urn = request.args.get('user_urn')
    if not user_urn or user_urn not in USER_DATA:
        return jsonify({'success': False, 'message': 'Invalid user URN'}), 400
    
    with open(POSTS_FILE, 'r') as f:
        reader = csv.DictReader(f)
        posts = [p for p in reader if p['user_urn'] == user_urn]
    
    posted = sum(1 for p in posts if p['posted'] == 'True')
    scheduled = sum(1 for p in posts if p['posted'] == 'False')
    total = len(posts)
    canceled = total - (posted + scheduled)
    
    posts_by_day = {}
    for p in posts:
        scheduled_time = datetime.strptime(p['scheduled_time'], '%Y-%m-%d %H:%M:%S')
        day = scheduled_time.strftime('%Y-%m-%d')
        posts_by_day[day] = posts_by_day.get(day, 0) + (1 if p['posted'] == 'True' else 0)
    
    last_7_days = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(6, -1, -1)]
    posts_by_day_data = {day: posts_by_day.get(day, 0) for day in last_7_days}
    
    return jsonify({
        'posted': posted,
        'scheduled': scheduled,
        'canceled': canceled,
        'posts_by_day': posts_by_day_data
    })

def check_and_post_scheduled():
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    with open(POSTS_FILE, 'r') as f:
        reader = csv.reader(f)
        posts = list(reader)
    
    with open(POSTS_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        for post in posts:
            post_id, content, tag, scheduled_time, posted, user_urn = post
            if posted == 'False' and scheduled_time <= current_time:
                post_to_linkedin(user_urn, content)
                writer.writerow([post_id, content, tag, scheduled_time, 'True', user_urn])
            else:
                writer.writerow(post)

def run_scheduler():
    schedule.every(1).minutes.do(check_and_post_scheduled)
    while True:
        schedule.run_pending()
        time.sleep(1)

# Start scheduler in a separate thread
scheduler_thread = Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()



if __name__ == "__main__":
    initialize_csv()
    threading.Thread(target=check_and_post_scheduled_posts, daemon=True).start()
    app.run(debug=True, host='0.0.0.0', port=5000)