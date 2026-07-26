import { AuthProvider } from "./AuthContext";
import { ClientsProvider } from "./ClientsContext";
import { TasksProvider } from "./TasksContext";
import { NotesProvider } from "./NotesContext";
import { PaymentsProvider } from "./PaymentsContext";

/**
 * Envuelve todos los Providers en uno solo. No se usa dentro de App.jsx por
 * defecto (App.jsx sigue pasando props explícitas a cada componente, igual que
 * el archivo original, para no cambiar ningún comportamiento). Queda disponible
 * para quien prefiera consumir estos datos vía Context en vez de props en
 * pantallas nuevas.
 *
 * Uso:
 *   <AppProviders auth={authApi} clients={clientsApi} tasks={tasksApi} notes={notesApi} payments={paymentsApi}>
 *     <App />
 *   </AppProviders>
 */
export function AppProviders({ auth, clients, tasks, notes, payments, children }) {
  return (
    <AuthProvider value={auth}>
      <ClientsProvider value={clients}>
        <TasksProvider value={tasks}>
          <NotesProvider value={notes}>
            <PaymentsProvider value={payments}>
              {children}
            </PaymentsProvider>
          </NotesProvider>
        </TasksProvider>
      </ClientsProvider>
    </AuthProvider>
  );
}
