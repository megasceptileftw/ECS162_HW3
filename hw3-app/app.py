from flask import Flask, jsonify, redirect, render_template, session, request
from authlib.integrations.flask_client import OAuth
from authlib.common.security import generate_token

from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

import os
import requests


app = Flask(__name__)
app.secret_key = os.urandom(24)

oauth = OAuth(app)

nonce = generate_token()


# Connect to MongoDB
client = MongoClient(os.getenv("MONGO_URI"))
db = client.get_default_database()
comments = db.comments  # use 'comments' collection


oauth.register(
    name=os.getenv('OIDC_CLIENT_NAME'),
    client_id=os.getenv('OIDC_CLIENT_ID'),
    client_secret=os.getenv('OIDC_CLIENT_SECRET'),
    #server_metadata_url='http://dex:5556/.well-known/openid-configuration',
    authorization_endpoint="http://localhost:5556/auth",
    token_endpoint="http://dex:5556/token",
    jwks_uri="http://dex:5556/keys",
    userinfo_endpoint="http://dex:5556/userinfo",
    device_authorization_endpoint="http://dex:5556/device/code",
    client_kwargs={'scope': 'openid email profile'}
)

def is_moderator(user: dict) -> bool:
    return user is not None and user.get("email") == "moderator@hw3.com"

@app.route('/')
def index():
    user = session.get('user')
    return render_template('index.html', user=user, is_moderator=is_moderator(user))

@app.route('/signedin')
def dashboard():
    user = session.get('user')
    if not user:
        return redirect('/')
    return render_template('index.html', user=user, is_moderator=is_moderator(user))

@app.route('/api/key')
def get_key():
    return jsonify({'apiKey': os.getenv('NYT_API_KEY')})

@app.route('/login')
def login():
    session['nonce'] = nonce
    redirect_uri = 'http://localhost:8000/authorize'
    return oauth.flask_app.authorize_redirect(redirect_uri, nonce=nonce)

@app.route('/authorize')
def authorize():
    token = oauth.flask_app.authorize_access_token()
    nonce = session.get('nonce')

    user_info = oauth.flask_app.parse_id_token(token, nonce=nonce)  # or use .get('userinfo').json()
    session['user'] = user_info
    return redirect('/signedin')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)

@app.route('/api/comments')
def get_comments():
    url = request.args.get('url')

    if url == "":
        return jsonify({'error': 'Invalid URL'}), 400

    if url:
        # Get comments for a single article
        comment_list = list(comments.find({'article_url': url}).sort('timestamp'))
        for c in comment_list:
            c['_id'] = str(c['_id'])
        return jsonify({'comments': comment_list})
    else:
        # Count comments + replies per article
        all_comments = comments.find()
        counts = {}

        for c in all_comments:
            article = c.get('article_url')
            reply_count = len(c.get('replies', []))
            counts[article] = counts.get(article, 0) + 1 + reply_count

        return jsonify({'counts': counts})

@app.route('/api/comments', methods=['POST'])
def post_comment():
    user = session.get('user')
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()  # safer style shown in lectures
    article_url = data.get('article_url')
    text = data.get('text')
    parent_id = data.get('parent_id')

    if not article_url or not text:
        return jsonify({'error': 'Missing fields'}), 400

    comment = {
        'article_url': article_url,
        'text': text,
        'user': user['email'],
        'timestamp': datetime.utcnow(),
        'moderated': False
    }

    if parent_id:
        result = comments.update_one(
            {'_id': ObjectId(parent_id)},
            {'$push': {'replies': comment}}
        )
        if result.matched_count == 0:
            return jsonify({'error': 'Parent comment not found'}), 404
        return jsonify({'ok': True})

    result = comments.insert_one(comment)
    return jsonify({'ok': True, 'id': str(result.inserted_id)}), 201


@app.route('/api/articles')
def get_articles():
    # This constant could be moved to the top of the file like BASE_URL
    url = "https://api.nytimes.com/svc/search/v2/articlesearch.json"
    api_key = os.getenv("NYT_API_KEY") 
    params = {
        'fq': 'timesTag.location:("Sacramento (Calif)", "Davis (Calif)")',
        'sort': 'newest',
        'api-key': api_key
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        return jsonify({'error': 'NYT API error'}), 502

    articles = response.json().get('response', {}).get('docs', [])
    return jsonify({'articles': articles})


@app.route('/api/comments/moderate', methods=['POST'])
def moderate_comment():
    user = session.get('user')
    if not is_moderator(user):
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() 

    comment_id = data.get('comment_id')    # top-level comment to moderate
    parent_id = data.get('parent_id')      # parent of reply (if moderating reply)
    reply_index = data.get('reply_index')  # index of reply in replies[]

    if parent_id is not None and reply_index is not None:
        # Moderate a reply by setting replies[reply_index].moderated = True
        path = f"replies.{reply_index}.moderated"
        result = comments.update_one(
            {'_id': ObjectId(parent_id)},
            {'$set': {path: True}}
        )
    elif comment_id:
        # Moderate a top-level comment
        result = comments.update_one(
            {'_id': ObjectId(comment_id)},
            {'$set': {'moderated': True}}
        )
    else:
        # No valid input provided
        return jsonify({'error': 'Missing comment ID or index'}), 400

    if result.matched_count == 0:
        return jsonify({'error': 'Comment not found'}), 404

    return jsonify({'ok': True})