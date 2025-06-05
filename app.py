from flask import Flask, render_template, request, redirect, url_for, send_file
import json
import random
import io

app = Flask(__name__)

# Load flashcards from a JSON file
def load_flashcards():
    with open("flashcards.json", "r") as f:
        return json.load(f)

# Save flash cards to JSON file
def save_flashcard(question, answer, category, tags):
    cards = load_flashcards()
    cards.append(
        {
            "question": question,
            "answer": answer,
            "category": category,
            "tags": tags
        })
    with open("flashcards.json", "w") as f:
        json.dump(cards, f, indent=4)

@app.route("/")
def index():
    cards = load_flashcards()
    return render_template("index.html", cards=cards)

@app.route("/add", methods=["GET", "POST"])
def add():
    if request.method == "POST":
        question = request.form["question"]
        answer = request.form["answer"]
        category = request.form.get("category", "Uncategorized")
        tags = [tag.strip() for tag in request.form.get("tags", "").split(",") if tag.strip()]
        save_flashcard(question, answer, category, tags)
        return redirect(url_for("index"))
    return render_template("add.html")

@app.route("/download")
def download_flashcards():
    cards = load_flashcards()
    buffer = io.BytesIO()
    buffer.write(json.dumps(cards, indent=4).encode('utf-8'))
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype="application/json",
        as_attachment=True,
        download_name="flashcards.json"
    )

@app.route("/upload", methods=["POST"])
def upload():
    uploaded = request.get_json()
    if not isinstance(uploaded, list):
        return "Invalid format", 400

    cards = load_flashcards()
    cards.extend(uploaded)

    with open("flashcards.json", "w") as f:
        json.dump(cards, f, indent=2)

    return "Success", 200



if __name__ == "__main__":
    app.run(debug=True)
