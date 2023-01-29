from tkinter import *
from tkinter import ttk
import sqlite3
import datetime

root = Tk()
root.title('The Green Report - Bug Tracker')
root.resizable(False, False)


def search_through_bugs(search_by, search_term):
    connection = sqlite3.connect('bug_tracker.db')
    if search_by == "id" and search_term.isnumeric():
        search_query = "SELECT * FROM bugs WHERE id = " + search_term
    else:
        search_query = "SELECT * FROM bugs WHERE title LIKE '%" + search_term + "%'"
    cursor = connection.cursor()
    cursor.execute(search_query)
    records = cursor.fetchall()
    if len(records) == 0:
        status_bar.config(text="No matching results!", fg="#EE4B2B")
    else:
        status_bar.config(text="Matching results found!", fg="#228B22")
        clear_treeview()
    populate_treeview(records)
    connection.commit()
    connection.close()


def populate_treeview(records):
    count = 0

    for record in records:
        if count % 2 == 0:
            treeview.insert(parent='',
                            index='end',
                            text='',
                            values=(record[0], record[1], record[2], record[3], record[4], record[5]),
                            tags=('even_rows',)
                            )
        else:
            treeview.insert(parent='',
                            index='end',
                            text='',
                            values=(record[0], record[1], record[2], record[3], record[4], record[5]),
                            tags=('odd_rows',)
                            )
        count += 1


def clear_treeview():
    for item in treeview.get_children():
        treeview.delete(item)


def add_bug(title, reporter, resolver, priority, status, description):
    connection = sqlite3.connect('bug_tracker.db')
    data = (None, title, reporter, resolver, priority, status, description, datetime.datetime.now())
    add_query = "INSERT INTO bugs values(?, ?, ?, ?, ?, ?, ?, ?)"
    connection.execute(add_query, data)
    connection.commit()
    clear_treeview()
    query_database()
    status_bar.config(text="Bug successfully added!", fg="#228B22")


def report_bug():
    rb_window = Toplevel(root)
    rb_window.title('Report a bug')
    rb_window.resizable(False, False)
    rb_window.grab_set()
    [
        title_input,
        desc_input,
        reporter_input,
        resolver_input,
        po_datatype,
        status_datatype
    ] = add_and_edit_controls(
        rb_window
    )

    report_button = Button(
        rb_window,
        text="Report bug",
        command=lambda: [
            add_bug(
                title_input.get(),
                reporter_input.get(),
                resolver_input.get(),
                po_datatype.get(),
                status_datatype.get(),
                desc_input.get("1.0", "end-1c")
            ),
            rb_window.destroy()
        ]
    )
    report_button.pack(pady=10)


def display_bugs():
    clear_treeview()
    query_database()


def search_bug():
    sb_window = Toplevel(root)
    sb_window.title('Search a bug')
    sb_window.resizable(False, False)
    sb_window.grab_set()

    search_input = Entry(sb_window, width=60)
    search_input.insert(END, "Type in the search term")
    search_input.pack(padx=10, pady=10)
    search_frame = Frame(sb_window)
    search_frame.pack(anchor=W, padx=10)
    search_by = Label(search_frame, text="Search by")
    search_by.grid(row=0, column=0, pady=(0, 10))
    search_options = ["title", "id"]
    search_datatype = StringVar()
    search_datatype.set("Select bug status")
    search_dropdown = OptionMenu(search_frame, search_datatype, *search_options)
    search_dropdown.grid(row=0, column=1, pady=(0, 10))
    sb_button = Button(
        search_frame,
        text="Search bugs",
        command=lambda: [
            search_through_bugs(
                search_datatype.get(),
                search_input.get()
            ),
            sb_window.destroy()
        ]
    )
    sb_button.grid(row=0, column=2, padx=10, pady=(0, 10))


def query_database():
    connection = sqlite3.connect('bug_tracker.db')
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT * FROM bugs")
    except sqlite3.OperationalError:
        cursor.execute("""
        CREATE TABLE bugs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        reporter TEXT,
        resolver TEXT,
        priority TEXT,
        status TEXT,
        description TEXT,
        time TIMESTAMP
        )
        """)
        cursor.execute("SELECT * FROM bugs")
    records = cursor.fetchall()
    populate_treeview(records)
    connection.commit()
    connection.close()


def add_and_edit_controls(window):
    title_frame = LabelFrame(window, text="Title")
    title_frame.pack(fill=X, padx=20)
    title_input = Entry(title_frame, width=60)
    title_input.pack(padx=10, pady=10)

    desc_frame = LabelFrame(window, text="Description")
    desc_frame.pack(fill=X, padx=20)
    desc_input = Text(desc_frame, width=50, height=25)
    desc_input.pack(padx=10, pady=10)

    other_frame = LabelFrame(window, text="Other information")
    other_frame.pack(fill=X, padx=20)
    reporter = Label(other_frame, text="Reporter")
    reporter.grid(row=0, column=0, padx=5, pady=10)
    reporter_input = Entry(other_frame)
    reporter_input.grid(row=0, column=1, pady=10)
    resolver = Label(other_frame, text="Resolver")
    resolver.grid(row=0, column=2, padx=(20, 5), pady=10)
    resolver_input = Entry(other_frame)
    resolver_input.grid(row=0, column=3, pady=10)
    priority = Label(other_frame, text="Priority")
    priority.grid(row=1, column=0, pady=(0, 10))
    priority_options = [
        "P1 - Critical",
        "P2 - High",
        "P3 - Medium",
        "P4 - Low"
    ]
    po_datatype = StringVar()
    po_datatype.set("Select priority")
    priority_dropdown = OptionMenu(other_frame, po_datatype, *priority_options)
    priority_dropdown.grid(row=1, column=1, pady=(0, 10))
    status = Label(other_frame, text="Status")
    status.grid(row=1, column=2, pady=(0, 10))
    status_options = [
        "Not started",
        "In progress",
        "In code review",
        "On QA",
        "In production",
        "Closed"
    ]
    status_datatype = StringVar()
    status_datatype.set("Select bug status")
    status_dropdown = OptionMenu(other_frame, status_datatype, *status_options)
    status_dropdown.grid(row=1, column=3, pady=(0, 10))
    return [title_input, desc_input, reporter_input, resolver_input, po_datatype, status_datatype]


def edit_bug_data(title, resolver, priority, status, description, bug_id):
    connection = sqlite3.connect('bug_tracker.db')
    cursor = connection.cursor()
    cursor.execute(
        """
        UPDATE bugs SET
        title = :title,
        resolver = :resolver,
        priority = :priority,
        status = :status,
        description = :description
        WHERE id = :id
        """, {
            'title': title,
            'resolver': resolver,
            'priority': priority,
            'status': status,
            'description': description,
            'id': bug_id
        })
    connection.commit()
    connection.close()
    display_bugs()
    status_bar.config(text="Bug successfully edited!", fg="#228B22")


def edit_bug(event):
    selected_row = treeview.selection()[0]
    bug_id = treeview.item(selected_row, "values")[0]
    connection = sqlite3.connect('bug_tracker.db')
    cursor = connection.cursor()
    cursor.execute("SELECT * FROM bugs WHERE id = " + bug_id)
    record = cursor.fetchone()
    edit_window = Toplevel(root)
    edit_window.title("Edit bug")
    edit_window.resizable(False, False)
    edit_window.wait_visibility()
    edit_window.grab_set()
    [
        title_input,
        desc_input,
        reporter_input,
        resolver_input,
        po_datatype,
        status_datatype
    ] = add_and_edit_controls(
        edit_window
    )
    time_label = Label(edit_window, text="Created on: " + record[7].split(".")[0])
    time_label.pack(pady=(10, 0))
    edit_button = Button(
        edit_window,
        text="Edit bug",
        command=lambda: [
            edit_bug_data(
                title_input.get(),
                resolver_input.get(),
                po_datatype.get(),
                status_datatype.get(),
                desc_input.get("1.0", "end-1c"),
                bug_id
            ),
            edit_window.destroy()
        ]
    )
    edit_button.pack(pady=10)

    title_input.insert(0, record[1])
    desc_input.insert(END, record[6])
    reporter_input.insert(0, record[2])
    reporter_input.config(state=DISABLED)
    resolver_input.insert(0, record[3])
    po_datatype.set(record[4])
    status_datatype.set(record[5])


def sort_treeview(sort_by):
    count = 0
    data = [(treeview.item(item)['text'], treeview.item(item)['values']) for item in treeview.get_children()]
    if sort_by == "status":
        data.sort(key=lambda x: x[1][5])
        status_bar.config(text="Bugs sorted by status!", fg="#228B22")
    else:
        data.sort(key=lambda x: x[1][4])
        status_bar.config(text="Bugs sorted by priority!", fg="#228B22")
    treeview.delete(*treeview.get_children())
    for item in data:
        if count % 2 == 0:
            treeview.insert("", END, text=item[0], values=item[1], tags=('even_rows',))
        else:
            treeview.insert("", END, text=item[0], values=item[1], tags=('odd_rows',))
        count += 1


style = ttk.Style()
style.theme_use('default')
style.configure(
    "Treeview",
    background="#D3D3D3",
    foreground="black",
    rowheight=25,
    fieldbackground="#D3D3D3"
)
style.map('Treeview', background=[('selected', "#097969")])

button_frame = Frame(root)
create_button = Button(button_frame, text="Report bug", command=report_bug)
create_button.grid(row=0, column=0, padx=10, pady=10)
search_button = Button(button_frame, text="Search bugs", command=search_bug)
search_button.grid(row=0, column=1, padx=10, pady=10)
display_bugs_button = Button(
    button_frame,
    text="Display all bugs",
    command=lambda: [display_bugs(), status_bar.config(text="All bugs displayed!", fg="#228B22")]
)
display_bugs_button.grid(row=0, column=2, padx=10, pady=10)
button_frame.pack()

treeview_frame = Frame(root)
treeview_frame.pack(pady=10)

tree_scroll = Scrollbar(treeview_frame)
tree_scroll.pack(side=RIGHT, fill=Y)

treeview = ttk.Treeview(treeview_frame, yscrollcommand=tree_scroll.set, selectmode="extended")
treeview.pack()

tree_scroll.config(command=treeview.yview)

treeview['columns'] = ("ID", "Title", "Reporter", "Resolver", "Priority", "Status")

treeview.column("#0", width=0, stretch=NO)
treeview.column("ID", anchor=W, width=80, minwidth=60)
treeview.column("Title", anchor=W, width=340, minwidth=250)
treeview.column("Reporter", anchor=W, width=140, minwidth=100)
treeview.column("Resolver", anchor=W, width=140, minwidth=100)
treeview.column("Priority", anchor=W, width=80, minwidth=60)
treeview.column("Status", anchor=W, width=100, minwidth=80)

treeview.heading("#0", text="", anchor=W)
treeview.heading("ID", text="ID", anchor=W)
treeview.heading("Title", text="Title", anchor=W)
treeview.heading("Reporter", text="Reporter", anchor=W)
treeview.heading("Resolver", text="Resolver", anchor=W)
treeview.heading("Priority", text="Priority", anchor=W, command=lambda: sort_treeview("priority"))
treeview.heading("Status", text="Status", anchor=W, command=lambda: sort_treeview("status"))

treeview.tag_configure('odd_rows', background="white")
treeview.tag_configure('even_rows', background="#93C572")

treeview.bind('<Double-1>', edit_bug)

status_bar = Label(root, text="Bug Tracker v1.0", bd=1, relief=SUNKEN, anchor=W)
status_bar.pack(expand=YES, fill=BOTH)

query_database()
root.mainloop()
