import { useEffect, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("normal");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tasks`);
        const data = await res.json();
        if (!cancelled) {
          setTasks(data);
        }
      } catch (err) {
        console.error("Error loading tasks", err);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const reloadTasks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error reloading tasks", err);
    }
  };

  const addTask = async () => {
    if (!title.trim()) return;

    await fetch(`${API_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        due_date: dueDate || null,
        priority,
      }),
    });

    setTitle("");
    setDueDate("");
    setPriority("normal");
    reloadTasks();
  };

  const toggleTask = async (task) => {
    await fetch(`${API_URL}/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });

    reloadTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`${API_URL}/api/tasks/${id}`, {
      method: "DELETE",
    });

    reloadTasks();
  };

  const now = new Date();

  const filteredTasks = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    if (filter === "overdue") {
      if (!t.due_date || t.completed) return false;
      const d = new Date(t.due_date);
      return d < now;
    }
    return true;
  });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;

  return (
    <div className="app-page">
      <div className="app-layout">
        {/* Ляв панел – форма + филтри */}
        <section className="panel panel-left">
          <h1 className="app-title">📋 To-Do List</h1>
          <p className="app-subtitle">
            Организирай задачите си с крайни срокове и приоритети.
          </p>

          <div className="field-group">
            <label className="field-label">Заглавие</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Нова задача..."
              className="text-input"
            />
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Срок</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="field-group">
              <label className="field-label">Приоритет</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="text-input"
              >
                <option value="low">Нисък</option>
                <option value="normal">Нормален</option>
                <option value="high">Висок</option>
              </select>
            </div>
          </div>

          <button onClick={addTask} className="btn btn-primary">
            Добави
          </button>

          <div className="stats-row">
            <span>Общо: {total}</span>
            <span>Завършени: {completed}</span>
          </div>

          <div className="filters-row">
            <button
              className={
                "chip" + (filter === "all" ? " chip-active" : "")
              }
              onClick={() => setFilter("all")}
            >
              Всички
            </button>
            <button
              className={
                "chip" + (filter === "active" ? " chip-active" : "")
              }
              onClick={() => setFilter("active")}
            >
              Активни
            </button>
            <button
              className={
                "chip" +
                (filter === "completed" ? " chip-active" : "")
              }
              onClick={() => setFilter("completed")}
            >
              Завършени
            </button>
            <button
              className={
                "chip" +
                (filter === "overdue" ? " chip-active" : "")
              }
              onClick={() => setFilter("overdue")}
            >
              Просрочени
            </button>
          </div>
        </section>

        {/* Десен панел – списък със задачите */}
        <section className="panel panel-right">
          <ul className="task-list">
            {filteredTasks.map((task) => {
              const isOverdue =
                task.due_date &&
                !task.completed &&
                new Date(task.due_date) < now;

              return (
                <li
                  key={task.id}
                  className={
                    "task-item" +
                    (task.completed ? " task-completed" : "")
                  }
                  style={{
                    borderLeftColor: isOverdue
                      ? "#f97373"
                      : task.priority === "high"
                      ? "#facc15"
                      : task.priority === "low"
                      ? "#22c55e"
                      : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                  />

                  <div className="task-main">
                    <span className="task-title">
                      {task.title}
                    </span>
                    <div className="task-meta-row">
                      {task.due_date && (
                        <span
                          className={
                            "task-tag" +
                            (isOverdue ? " task-tag-overdue" : "")
                          }
                        >
                          Срок:{" "}
                          {new Date(
                            task.due_date
                          ).toLocaleDateString()}
                        </span>
                      )}
                      {task.priority && (
                        <span className="task-tag">
                          Приоритет:{" "}
                          {task.priority === "high"
                            ? "Висок"
                            : task.priority === "low"
                            ? "Нисък"
                            : "Нормален"}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn-icon"
                    title="Изтрий"
                  >
                    ✖
                  </button>
                </li>
              );
            })}
          </ul>

          {filteredTasks.length === 0 && (
            <p className="empty-text">
              Няма задачи по избрания филтър 🎉
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;