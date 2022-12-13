// STYLE

const edit_icon = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="EditIcon" aria-label="fontSize small">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
                    </svg>`
const delete_icon = `<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DeleteIcon" aria-label="fontSize small">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                    </svg>`

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

    // Edit the todo task
    const editTodo = (id, title, isEdit, completed) => {
        return fetch(URL + `/${id}`, {
            method: "PATCH",
            body: JSON.stringify({title, isEdit, completed}),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const getTodos = () => {
        return fetch(URL).then((res) => res.json());
    };

    return {
        addTodo,
        removeTodo,
        editTodo,
        getTodos
    };
})();

/* ------------------------------------------- MODEL ------------------------------------------- */
const Model = (() => {
    class State {

        #todos;
        #onChange;

        constructor() {
            this.#todos = [];
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
    let { 
        addTodo,
        removeTodo,
        editTodo,
        getTodos
    } = APIs;

    return {
        State,
        addTodo,
        removeTodo,
        editTodo,
        getTodos
    };
})();

/* ------------------------------------------- VIEW ------------------------------------------- */
const View = (() => {
    const formEl = document.querySelector(".form");
    const completed_todoListEl = document.querySelector("#todo__list--completed");
    const pending_todoListEl = document.querySelector("#todo__list--pending");
    const none_todoListEl = document.querySelector("#todo__list--none");

    const updateTodoList = (todos) => {
        let pendingTemplate = "";
        let completedTemplate = "";

        todos
            .sort((a, b) => b.id - a.id) // sorting
            .forEach((todo) => {
                
                if(todo.completed){
                    completedTemplate +=  `<li>
                                              <span class="span-title--complete" id="${todo.id}">${todo.title}</span>
                                              <button class="btn--delete" id="${todo.id}">delete</button>
                                           </li>`
                } else {
                    pendingTemplate += `<li>     
                                            ${todo.isEdit ? `<input type="text" id="${todo.id}" placeholder="${todo.title}" value="${todo.title}"/>` : `<span class="span-title--pending" id="${todo.id}">${todo.title}</span>`}
                                            <button class="btn--editing" id="${todo.id}">edit</button>
                                            <button class="btn--delete" id="${todo.id}">delete</button>
                                        </li>`;
                }
            
            }); 

        none_todoListEl.style.display = pendingTemplate === "" ? "block" : "none";
        completed_todoListEl.innerHTML = completedTemplate;
        pending_todoListEl.innerHTML = pendingTemplate;
    };

    return {
        formEl,
        completed_todoListEl,
        pending_todoListEl,
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
            Model.addTodo({title, isEdit: false, completed: false}).then((res) => {
                    state.todos = [res, ...state.todos];
                    event.target[0].value = ""
                }).catch((err) => {alert(`add new task failed: ${err}`)});
        });
    };

    const removeTodo = () => {
        View.pending_todoListEl.addEventListener("click",(event)=>{
            const id = event.target.id;
            if(event.target.className === "btn--delete"){
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo => +todo.id !== +id)
                }).catch(err=>alert(`delete todo failed: ${err}`))
            }
        })

        View.completed_todoListEl.addEventListener("click",(event)=>{
            const id = event.target.id;
            if(event.target.className === "btn--delete"){
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo => +todo.id !== +id)
                }).catch(err=>alert(`delete todo failed: ${err}`))
            }
        })
    };

    // edit the todo
    const editTodo = () => {
        View.pending_todoListEl.addEventListener("click", (event)=>{
            const id = event.target.id;
            if(event.target.className === "btn--editing"){
                state.todos = state.todos.map((todo) => {
                    if(+todo.id === +id) {
                        Model.editTodo(+todo.id, todo.title, !todo.isEdit, todo.completed)
                    }
                    return todo;
                })
            }
        })
    };

    // complete status of the todo
    const completeTodo = () => {
        View.pending_todoListEl.addEventListener("click", (event)=>{
            const id = event.target.id;
            if(event.target.className === "span-title--pending"){
                state.todos = state.todos.map((todo) => {
                    if(+todo.id === +id) {
                        Model.editTodo(+todo.id, todo.title, todo.isEdit, !todo.completed);
                        todo.completed = !todo.completed;
                    }
                    return todo;
                })
            }
        })

        View.completed_todoListEl.addEventListener("click", (event)=>{
            const id = event.target.id;
            if(event.target.className === "span-title--complete"){
                state.todos = state.todos.map((todo) => {
                    if(+todo.id === +id) {
                        Model.editTodo(+todo.id, todo.title, todo.isEdit, !todo.completed);
                        todo.completed = !todo.completed;
                    }
                    return todo;
                })
            }
        })
    };


    const bootstrap = () => {
        getTodos();
        addTodo();
        removeTodo();
        editTodo();
        completeTodo();
        state.subscribe(() => {
            View.updateTodoList(state.todos);
        });
    };

    return {
        bootstrap,
    };
})(View, Model);

ViewModel.bootstrap();