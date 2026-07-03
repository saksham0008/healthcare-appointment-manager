import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorSearch from './pages/patient/DoctorSearch';
import BookAppointment from './pages/patient/BookAppointment';
import MyAppointments from './pages/patient/MyAppointments';
import AppointmentDetail from './pages/patient/AppointmentDetail';
import DoctorDashboard from './pages/doctor/Dashboard';
import PostVisitForm from './pages/doctor/PostVisitForm';
import AdminDashboard from './pages/admin/Dashboard';
import CreateDoctor from './pages/admin/CreateDoctor';
import ManageLeaves from './pages/admin/ManageLeaves';

const App: React.FC = () => (
  <Provider store={store}>
    <Router>
      <Navbar />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />

        {/* Patient routes */}
        <PrivateRoute roles={['patient']} path="/patient/doctors" exact>
          <DoctorSearch />
        </PrivateRoute>
        <PrivateRoute roles={['patient']} path="/patient/book/:doctorId">
          <BookAppointment />
        </PrivateRoute>
        <PrivateRoute roles={['patient']} path="/patient/appointments" exact>
          <MyAppointments />
        </PrivateRoute>
        <PrivateRoute roles={['patient']} path="/patient/appointment/:id">
          <AppointmentDetail />
        </PrivateRoute>

        {/* Doctor routes */}
        <PrivateRoute roles={['doctor']} path="/doctor/dashboard" exact>
          <DoctorDashboard />
        </PrivateRoute>
        <PrivateRoute roles={['doctor']} path="/doctor/appointment/:id">
          <PostVisitForm />
        </PrivateRoute>

        {/* Admin routes */}
        <PrivateRoute roles={['admin']} path="/admin/dashboard" exact>
          <AdminDashboard />
        </PrivateRoute>
        <PrivateRoute roles={['admin']} path="/admin/create-doctor">
          <CreateDoctor />
        </PrivateRoute>
        <PrivateRoute roles={['admin']} path="/admin/leaves">
          <ManageLeaves />
        </PrivateRoute>

        <Redirect to="/" />
      </Switch>
    </Router>
  </Provider>
);

export default App;
