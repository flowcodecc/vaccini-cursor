import { useState } from 'react'
import { supabase } from '@/lib/supabase'

// Contas de demonstração pré-definidas
const demoAccounts = [
  { email: 'admin@demo.com', password: 'demo123', role: 'Administrador' },
  { email: 'medico@demo.com', password: 'demo123', role: 'Médico' },
  { email: 'atendente@demo.com', password: 'demo123', role: 'Atendente' }
]

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDemoAccounts, setShowDemoAccounts] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Após login bem-sucedido, você pode buscar os dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('id', data.user?.id)
        .single()

      if (userError) throw userError

      console.log('Dados do usuário:', userData)
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  function handleDemoLogin(demoAccount: typeof demoAccounts[0]) {
    setEmail(demoAccount.email)
    setPassword(demoAccount.password)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Carregando...' : 'Entrar'}
        </button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showDemoAccounts ? 'Ocultar contas de demonstração' : 'Mostrar contas de demonstração'}
        </button>

        {showDemoAccounts && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600 mb-2">Selecione uma conta de demonstração:</p>
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDemoLogin(account)}
                className="w-full p-2 text-left text-sm border rounded-md hover:bg-gray-50"
              >
                <div className="font-medium">{account.role}</div>
                <div className="text-gray-500 text-xs">Email: {account.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 