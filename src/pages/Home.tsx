import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Bem-vindo à Vaccini</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/appointments"
          className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Meus Agendamentos</h2>
          <p className="text-gray-600">
            Visualize e gerencie seus agendamentos de vacinação.
          </p>
        </Link>

        <Link
          to="/quote"
          className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Orçamentos</h2>
          <p className="text-gray-600">
            Crie e gerencie orçamentos para suas vacinações.
          </p>
        </Link>

        <Link
          to="/schedule"
          className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Agendar Vacinação</h2>
          <p className="text-gray-600">
            Agende sua vacinação em uma de nossas unidades.
          </p>
        </Link>

        <Link
          to="/dependents"
          className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Dependentes</h2>
          <p className="text-gray-600">
            Gerencie os dependentes vinculados à sua conta.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Home; 