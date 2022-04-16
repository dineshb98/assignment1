const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format, isValid } = require("date-fns");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertTodoObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const isValidCategory = (category) =>
  category === "WORK" || category === "HOME" || category === "LEARNING";

const isValidStatus = (status) =>
  status === "TO DO" || status === "IN PROGRESS" || status === "DONE";

const isValidPriority = (priority) =>
  priority === "HIGH" || priority === "LOW" || priority === "MEDIUM";

const isValidDate = (date) => isValid(new Date(date));

app.get("/todos/", async (request, response) => {
  const { category, status, priority, search_q = "" } = request.query;
  let getTodoQuery;
  let todoArray;

  if (priority !== undefined && status !== undefined) {
    if (isValidPriority(priority) && isValidStatus(status)) {
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            status LIKE '${status}' AND priority LIKE '${priority}';`;
      todoArray = await database.all(getTodoQuery);
      response.send(
        todoArray.map((eachTodo) => convertTodoObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      if (isValidPriority(priority) === false) {
        response.send("Invalid Todo Priority");
      } else if (isValidStatus(status) === false) {
        response.send("Invalid Todo Status");
      }
    }
  } else if (category !== undefined && status !== undefined) {
    if (isValidCategory(category) && isValidStatus(status)) {
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            status LIKE '${status}' AND category LIKE '${category}';`;
      todoArray = await database.all(getTodoQuery);
      response.send(
        todoArray.map((eachTodo) => convertTodoObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      if (isValidCategory(category) === false) {
        response.send("Invalid Todo Category");
      } else if (isValidStatus(status) === false) {
        response.send("Invalid Todo Status");
      }
    }
  } else if (category !== undefined && priority !== undefined) {
    if (isValidCategory(category) && isValidPriority(priority)) {
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            category LIKE '${category}' AND priority LIKE '${priority}';`;
      todoArray = await database.all(getTodoQuery);
      response.send(
        todoArray.map((eachTodo) => convertTodoObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      if (isValidCategory(category) === false) {
        response.send("Invalid Todo Category");
      } else if (isValidPriority(priority) === false) {
        response.send("Invalid Todo Priority");
      }
    }
  } else if (priority !== undefined) {
    if (isValidPriority(priority)) {
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            priority LIKE '${priority}';`;
      todoArray = await database.all(getTodoQuery);
      response.send(
        todoArray.map((eachTodo) => convertTodoObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (status !== undefined) {
    if (isValidStatus(status)) {
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            status LIKE '${status}';`;
      todoArray = await database.all(getTodoQuery);
      response.send(
        todoArray.map((eachTodo) => convertTodoObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (category !== undefined) {
    if (isValidCategory(category)) {
      getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            category LIKE '${category}';`;
      todoArray = await database.all(getTodoQuery);
      response.send(
        todoArray.map((eachTodo) => convertTodoObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    getTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            todo LIKE '%${search_q}%';`;
    todoArray = await database.all(getTodoQuery);
    response.send(
      todoArray.map((eachTodo) => convertTodoObjectToResponseObject(eachTodo))
    );
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertTodoObjectToResponseObject(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isValidDate(date)) {
    const dueDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        due_date = '${dueDate}'`;
    const todoArray = await database.all(getTodoQuery);
    response.send(
      todoArray.map((eachTodo) => convertTodoObjectToResponseObject(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (
    isValidCategory(category) &&
    isValidStatus(status) &&
    isValidPriority(priority) &&
    isValidDate(dueDate)
  ) {
    const postTodoQuery = `
    INSERT INTO todo (id,todo,priority,status,category,due_date)
    VALUES (${id},'${todo}', '${priority}', '${status}','${category}','${dueDate}');`;
    await database.run(postTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    if (isValidCategory(category) === false) {
      response.send("Invalid Todo Category");
    } else if (isValidStatus(status) === false) {
      response.send("Invalid Todo Status");
    } else if (isValidPriority(priority) === false) {
      response.send("Invalid Todo Priority");
    } else {
      response.send("Invalid Due Date");
    }
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;
  let updateTodoQuery;

  if (todo !== undefined) {
    updateTodoQuery = `
        UPDATE
            todo
        SET
            todo = '${todo}'
        WHERE
            id = ${todoId};`;
    await database.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (priority !== undefined) {
    if (isValidPriority(priority)) {
      updateTodoQuery = `
        UPDATE
            todo
        SET
            priority = '${priority}'
        WHERE
            id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (status !== undefined) {
    if (isValidStatus(status)) {
      updateTodoQuery = `
        UPDATE
            todo
        SET
            status = '${status}'
        WHERE
            id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (category !== undefined) {
    if (isValidCategory(category)) {
      updateTodoQuery = `
        UPDATE
            todo
        SET
            category = '${category}'
        WHERE
            id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (dueDate !== undefined) {
    if (isValidDate(dueDate)) {
      updateTodoQuery = `
        UPDATE
            todo
        SET
            due_date = '${dueDate}'
        WHERE
            id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
