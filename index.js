// STYLE

const edit_icon = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="EditIcon" aria-label="fontSize small"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>`
const delete_icon = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DeleteIcon" aria-label="fontSize small"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>`

// API DATA
const APIs = (() => {
    const URL = "http://localhost:3000/todos";

    const addTodo = (newTodo) => {
        return fetch(URL, {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const removeTodo = (id) => {
        return fetch(URL + `/${id}`, {
            method: "DELETE",
        }).then((res) => res.json());
    };

    const updateTodo = (id, newTodo) => {
        return fetch(URL + `/${id}`, {
            method: "PUT",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const getTodos = () => {
        return fetch(URL).then((res) => res.json());
    };

    return {
        addTodo,
        removeTodo,
        updateTodo,
        getTodos
    };
})();

/* ------------------------------------------- MODEL ------------------------------------------- */
const Model = (() => {
    class State {

        #todos;
        #onChange;
        title;
        completed;

        constructor() {
            this.#todos = [];
            this.completed = false;
        }

        get todos() {
            return this.#todos;
        }

        set todos(newTodo) {
            this.#todos = newTodo;
            this.#onChange?.();
        }

        subscribe(callback) {
            this.#onChange = callback;
        }
    }
    let { updateTodo, getTodos, removeTodo, addTodo } = APIs;

    return {
        State,
        getTodos,
        addTodo,
        removeTodo,
        updateTodo
    };
})();

/* ------------------------------------------- VIEW ------------------------------------------- */
const View = (() => {
    const formEl = document.querySelector(".form");
    const todoListEl = document.querySelector(".todo-list");

    const updateTodoList = (todos, status) => {
        let template = "";
        todos.forEach((todo) => {
            // complete task - attempt to change the order depends on the completeness of the tasks
                todoTemplate = `
                <li>
                    <div id=${todo.id} class="todo__task--tastText">
                        <span id=${todo.id}>${todo.title}</span>
                    </div>

                    <div>
                        <button class="btn--edit" id=${todo.id}>edit</button>
                        <button class="btn--delete" id=${todo.id}>delete</button>
                    </div>    
                </li>
                `
        template += todoTemplate;
        });
        if(todos.length === 0){ template = "no active task"}
        todoListEl.innerHTML = template;
    };

    return {
        formEl,
        todoListEl,
        updateTodoList
    };
})();

/* ------------------------------------------- VIEW MODEL ------------------------------------------- */
const ViewModel = ((View, Model) => {
    const state = new Model.State();

    const getTodos = () => {
        Model.getTodos().then((res) => {
            state.todos = res;
        });
    };

    const addTodo = () => {
        View.formEl.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const title = event.target[0].value;
            if(title.trim() === "") {
                alert("please input title!");
                return;
            }
            const newTodo = {title, edit: false, completed: false};
            Model.addTodo(newTodo)
                .then((res) => {
                    state.todos = [res, ...state.todos];
                    event.target[0].value = ""
                })
                .catch((err) => {
                    alert(`add new task failed: ${err}`);
                });
        });
    };

    const removeTodo = () => {
        View.todoListEl.addEventListener("click",(event)=>{
            const id = event.target.id;
            if(event.target.className === "btn--delete"){
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo => +todo.id !== +id)
                }).catch(err=>alert(`delete todo failed: ${err}`))
            }
        })
    };

    // edit the todo
    const updateTodo = () => {
        View.todoListEl.addEventListener("click", (event)=>{
            if(event.target.className === "btn--edit"){
                const spanText = todoListEl.querySelectorAll(`span[id="${event.target.id}"]`)[0];
                const taskText = todoListEl.querySelectorAll(`input[id="${event.target.id}"]`)[0];
                const divText = todoListEl.querySelectorAll(`div[id="${event.target.id}"]`)[0];
                
                if (spanText === undefined) {
                    var arr = [];
                    state.todos.forEach((todo) => {
                        if (+todo.id === +event.target.id) {
                            todo.title = taskText.value;
                            Model.updateTodo(event.target.id, todo);
                        }
                        arr.push(todo)
                    })
                    state.todos = arr;
                    divText.innerHTML = `<span id=${event.target.id}>${taskText.value}</span>`
                } else if (spanText.tagName === "SPAN") {
                    divText.innerHTML = `<input id="${event.target.id}" type="text" />`
                }
            }
        })
    };


    const bootstrap = () => {
        getTodos();
        addTodo();
        removeTodo();
        updateTodo();
        state.subscribe(() => {
            View.updateTodoList(state.todos);
        });
    };

    return {
        bootstrap,
    };
})(View, Model);

ViewModel.bootstrap();