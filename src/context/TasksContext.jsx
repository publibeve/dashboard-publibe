import { createContext, useContext } from "react";

const TasksContext = createContext(null);

export function TasksProvider({ value, children }) {
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasksContext() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasksContext debe usarse dentro de <TasksProvider>");
  return ctx;
}
