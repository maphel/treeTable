import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ExampleLineItemsTable from './features/example/ExampleLineItemsTable';
function App() {
    return (_jsxs(_Fragment, { children: [_jsx(CssBaseline, {}), _jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h5", gutterBottom: true, children: "TreeTable Demo" }), _jsx(ExampleLineItemsTable, {})] })] }));
}
const rootEl = document.getElementById('root');
if (!rootEl)
    throw new Error('Root element not found');
createRoot(rootEl).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
