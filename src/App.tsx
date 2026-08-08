/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SocraticMentor from './components/SocraticMentor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SocraticMentor />} />
        <Route path="/chat" element={<SocraticMentor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
