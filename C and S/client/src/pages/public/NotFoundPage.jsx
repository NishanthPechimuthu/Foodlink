import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Home, ArrowLeft } from 'lucide-react';
import Container from '../../components/common/Container';
import Button from '../../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="py-20 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Container size="narrow">
        <div className="text-center max-w-md mx-auto clay-card bg-white p-10 border border-chocolate/10 shadow-xl rounded-3xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-cream-200 text-burntOrange flex items-center justify-center mx-auto shadow-sm">
            <Utensils className="w-8 h-8" />
          </div>

          <span className="text-5xl font-extrabold font-heading text-burntOrange">
            404
          </span>

          <h1 className="text-2xl font-bold font-heading text-chocolate">
            Page Not Found
          </h1>

          <p className="text-sm text-chocolate/75 leading-relaxed">
            The page you are looking for does not exist or may have been moved. Let's get you back to safe ground.
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <Link to="/">
              <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
