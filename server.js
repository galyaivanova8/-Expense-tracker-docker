const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: "db",
  user: "root",
  password: "rootpass",
  database: "expensedb",
  charset: "utf8mb4"
});

db.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }

  db.query("SET NAMES utf8mb4");
  console.log("Connected to database");
});

function getIcon(category) {
  if (category === "Храна") return "🍔";
  if (category === "Транспорт") return "🚗";
  if (category === "Забавление") return "🎮";
  if (category === "Образование") return "📚";
  return "🛒";
}

app.get("/", (req, res) => {
  db.query("SELECT * FROM expenses ORDER BY created_at DESC", (err, results) => {
    if (err) {
      res.send("Грешка при зареждане на разходите");
      return;
    }

    let total = 0;
    let maxExpense = 0;
    let categoryCount = {};

    results.forEach((expense) => {
      const amount = Number(expense.amount);
      total += amount;

      if (amount > maxExpense) {
        maxExpense = amount;
      }

      categoryCount[expense.category] = (categoryCount[expense.category] || 0) + 1;
    });

    let average = results.length > 0 ? total / results.length : 0;
    let topCategory = "Няма";
    let topCategoryCount = 0;

    Object.keys(categoryCount).forEach((category) => {
      if (categoryCount[category] > topCategoryCount) {
        topCategory = category;
        topCategoryCount = categoryCount[category];
      }
    });

    let html = `
<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="UTF-8">
<title>Expense Tracker</title>

<style>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  min-height:100vh;
  font-family:Segoe UI, Arial, sans-serif;
  background:
    radial-gradient(circle at top left, rgba(255,121,198,0.9), transparent 30%),
    radial-gradient(circle at top right, rgba(34,211,238,0.9), transparent 30%),
    linear-gradient(135deg, #0f172a, #312e81, #581c87);
  padding:35px;
  color:#111827;
}

.container{
  max-width:1200px;
  margin:auto;
}

.header{
  text-align:center;
  color:white;
  margin-bottom:30px;
}

.header h1{
  font-size:54px;
  margin-bottom:10px;
}

.header p{
  font-size:20px;
  opacity:0.9;
}

.stats{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:18px;
  margin-bottom:25px;
}

.stat{
  background:rgba(255,255,255,0.95);
  border-radius:26px;
  padding:24px;
  text-align:center;
  box-shadow:0 18px 45px rgba(0,0,0,0.25);
}

.stat h2{
  color:#7c3aed;
  font-size:34px;
  margin-bottom:8px;
}

.card{
  background:rgba(255,255,255,0.97);
  border-radius:30px;
  padding:30px;
  box-shadow:0 18px 45px rgba(0,0,0,0.28);
}

form.add-form{
  display:grid;
  grid-template-columns:2fr 1fr 1fr auto;
  gap:12px;
  margin-bottom:30px;
}

input, select{
  padding:15px;
  border:1px solid #e5e7eb;
  border-radius:16px;
  font-size:16px;
  background:#f9fafb;
}

input:focus, select:focus{
  outline:none;
  border-color:#7c3aed;
  box-shadow:0 0 0 3px rgba(124,58,237,0.18);
}

.add-btn{
  background:linear-gradient(135deg,#7c3aed,#06b6d4);
  color:white;
  border:none;
  border-radius:16px;
  padding:15px 24px;
  cursor:pointer;
  font-size:16px;
  font-weight:bold;
}

.add-btn:hover{
  transform:translateY(-2px);
  box-shadow:0 10px 20px rgba(124,58,237,0.35);
}

.expenses{
  display:grid;
  gap:15px;
}

.expense{
  display:flex;
  justify-content:space-between;
  align-items:center;
  background:linear-gradient(135deg,#f8fafc,#eef2ff);
  padding:18px;
  border-radius:22px;
  border-left:8px solid #7c3aed;
}

.left{
  display:flex;
  align-items:center;
  gap:15px;
}

.icon{
  width:54px;
  height:54px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:white;
  border-radius:18px;
  font-size:31px;
  box-shadow:0 8px 18px rgba(0,0,0,0.08);
}

.name{
  font-size:19px;
  font-weight:bold;
}

.category{
  color:#64748b;
  margin-top:5px;
}

.date{
  color:#94a3b8;
  font-size:13px;
  margin-top:4px;
}

.right{
  display:flex;
  align-items:center;
  gap:12px;
}

.amount{
  font-size:22px;
  font-weight:bold;
  color:#16a34a;
}

.delete-form{
  margin:0;
}

.delete-btn{
  background:#ef4444;
  color:white;
  border:none;
  border-radius:12px;
  padding:10px 14px;
  cursor:pointer;
  font-weight:bold;
}

.delete-btn:hover{
  background:#dc2626;
}

.empty{
  text-align:center;
  color:#64748b;
  padding:30px;
  background:#f8fafc;
  border-radius:20px;
  font-size:18px;
}

@media(max-width:850px){
  form.add-form{
    grid-template-columns:1fr;
  }

  .expense{
    flex-direction:column;
    align-items:flex-start;
    gap:15px;
  }

  .right{
    width:100%;
    justify-content:space-between;
  }

  .header h1{
    font-size:38px;
  }
}
</style>
</head>

<body>
<div class="container">

  <div class="header">
    <h1>💸 Expense Tracker</h1>
    <p>Лично приложение за следене на ежедневните разходи</p>
  </div>

  <div class="stats">
    <div class="stat">
      <h2>${results.length}</h2>
      <p>Брой разходи</p>
    </div>

    <div class="stat">
      <h2>${total.toFixed(2)} €</h2>
      <p>Общо разходи</p>
    </div>

    <div class="stat">
      <h2>${average.toFixed(2)} €</h2>
      <p>Среден разход</p>
    </div>

    <div class="stat">
      <h2>${maxExpense.toFixed(2)} €</h2>
      <p>Най-голям разход</p>
    </div>

    <div class="stat">
      <h2>${topCategory}</h2>
      <p>Най-честа категория</p>
    </div>
  </div>

  <div class="card">
    <form method="POST" action="/add" class="add-form">
      <input type="text" name="description" placeholder="Например: кафе, обяд, билет..." required>
      <input type="number" step="0.01" min="0.01" name="amount" placeholder="Сума €" required>

      <select name="category">
        <option>Храна</option>
        <option>Транспорт</option>
        <option>Забавление</option>
        <option>Образование</option>
        <option>Други</option>
      </select>

      <button type="submit" class="add-btn">Добави</button>
    </form>

    <div class="expenses">
`;

    if (results.length === 0) {
      html += `
      <div class="empty">
        Все още няма добавени разходи.
      </div>
      `;
    }

    results.forEach((expense) => {
      const date = new Date(expense.created_at).toLocaleString("bg-BG");

      html += `
      <div class="expense">
        <div class="left">
          <div class="icon">${getIcon(expense.category)}</div>

          <div>
            <div class="name">${expense.description}</div>
            <div class="category">${expense.category}</div>
            <div class="date">${date}</div>
          </div>
        </div>

        <div class="right">
          <div class="amount">${Number(expense.amount).toFixed(2)} €</div>

          <form method="POST" action="/delete/${expense.id}" class="delete-form">
            <button 
              type="submit" 
              class="delete-btn"
              onclick="return confirm('Сигурни ли сте, че искате да изтриете този разход?')"
            >
              Изтрий
            </button>
          </form>
        </div>
      </div>
      `;
    });

    html += `
    </div>
  </div>
</div>
</body>
</html>
`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });
});

app.post("/add", (req, res) => {
  const description = req.body.description;
  const amount = req.body.amount;
  const category = req.body.category;

  db.query(
    "INSERT INTO expenses (description, amount, category) VALUES (?, ?, ?)",
    [description, amount, category],
    () => {
      res.redirect("/");
    }
  );
});

app.post("/delete/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM expenses WHERE id = ?", [id], () => {
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});