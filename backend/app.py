from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Вземаме URL на базата от env (за Docker/K8s) или локален fallback
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://todo_user:todo_password@localhost:5432/todo_db",
)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    completed = db.Column(db.Boolean, default=False)

    # НОВИ ПОЛЕТА
    due_date = db.Column(db.DateTime, nullable=True)        # до кога е задачата
    priority = db.Column(db.String(10), default="normal")   # low / normal / high
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "completed": self.completed,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Създаваме таблицата, ако я няма
with app.app_context():
    db.create_all()


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    # по-готино е да ги връщаме по дата на създаване (последните най-отгоре)
    tasks = Task.query.order_by(Task.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tasks])


@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json() or {}

    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    # due_date идва от <input type="date"> → "YYYY-MM-DD"
    due_date_str = data.get("due_date")
    due_date = None
    if due_date_str:
        try:
            due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
        except ValueError:
            # за всеки случай – ако дойде пълно ISO
            try:
                due_date = datetime.fromisoformat(due_date_str)
            except ValueError:
                due_date = None

    priority = data.get("priority") or "normal"
    if priority not in ("low", "normal", "high"):
        priority = "normal"

    task = Task(
        title=title,
        completed=False,
        due_date=due_date,
        priority=priority,
    )
    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json() or {}

    if "title" in data:
        new_title = (data.get("title") or "").strip()
        if new_title:
            task.title = new_title

    if "completed" in data:
        task.completed = bool(data.get("completed"))

    if "due_date" in data:
        due_date_str = data.get("due_date")
        if not due_date_str:
            task.due_date = None
        else:
            try:
                task.due_date = datetime.strptime(due_date_str, "%Y-%m-%d")
            except ValueError:
                try:
                    task.due_date = datetime.fromisoformat(due_date_str)
                except ValueError:
                    task.due_date = None

    if "priority" in data:
        pr = data.get("priority") or "normal"
        if pr in ("low", "normal", "high"):
            task.priority = pr

    db.session.commit()
    return jsonify(task.to_dict())


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return "", 204


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
