'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Card from '@/components/Card';
import { FileCheck } from 'lucide-react';
import { themeColors } from '@/utils/colors';

interface LegalPage {
  id: string;
  page_type: string;
  title: string;
  content: string;
}

const ConsentimientoPage = () => {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
        const response = await fetch(`${apiUrl}/legal-pages/public/consent`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setPage(data.data);
        }
      } catch (error) {
        console.error('Error fetching consent page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-4">
              <FileCheck className="h-8 w-8" style={{ color: themeColors.primary }} />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {page?.title || 'Consentimientos Informados'}
              </h1>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Cargando...</p>
              </div>
            ) : (
              <div className="legal-content">
                <div dangerouslySetInnerHTML={{ __html: page?.content || '' }} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ConsentimientoPage;
