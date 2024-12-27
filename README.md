# 🧑‍💻 Understanding Event Sourcing with .NET

An exploration of different approaches to implementing the Event Model from Martin Dilger's book *Understanding Event Sourcing* using .NET.

---

## 📘 About the Book

*Understanding Event Sourcing* by Martin Dilger introduces the principles of Event Sourcing and Event Modeling, providing readers with practical insights and techniques to design and implement event-sourced systems.

- 📐 [Find the Event Model that is used as a basis for implementation](https://miro.com/app/board/uXjVKvTN_NQ=/)
- 📖 [Get the book on Leanpub](https://leanpub.com/eventmodeling-and-eventsourcing)
- 🖥️ [Check out the original repository](https://github.com/dilgerma/eventsourcing-book)


---

## 🚀 Purpose of This Repository

This repository is designed to explore the nuances of different implementation approaches and foster discussions with others in the community.

This repository serves as a comparative study, showcasing multiple approaches to implement the Event Model described in the book using .NET. Each approach fully implements the example from Martin's book, but with slight variations in applying the principles of event sourcing, such as state reconstruction or command handling.&#x20;

---

## 🛠️ Implementations

Here are the approaches included in this repository:

1. **Event Sourcing with Aggregate**: \
   Using an aggregate to build state and execute commands on top of that. The command handler implementations share a common structure, primarily revolving around the application of events to reconstruct state and executing commands by calling the aggregate.&#x20;
2. **Decider Model**: In this approach, Command Handlers are abstracted away to simplify the system design. The core difference lies in replacing the aggregate with a decider model. A decider focuses solely on deciding which events to emit based on a given command and the current state, separating decision-making logic from state mutation. This approach enhances testability by isolating responsibilities and making the system easier to extend or refactor.

Each approach is implemented in a separate branch for easy exploration.

---

## 🧑‍🔬 How to Use This Repository

1. Clone the repository:
   ```bash
   git clone https://github.com/SBortz/understanding-eventsourcing-dotnet.git
   ```
2. Switch to a specific branch:
   ```bash
   git checkout <branch-name>
   ```
3. Build and run the example:
   ```bash
   dotnet run
   ```
4. Explore the code and read the accompanying documentation.

---

## 🤝 Contributions

Contributions are welcome! If you have ideas for new approaches, improvements, or additional documentation, feel free to open a pull request or submit an issue.

---

Happy coding! 🎉

