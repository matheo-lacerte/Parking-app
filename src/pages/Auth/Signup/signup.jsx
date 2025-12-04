import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './signup.css';
import { useLoading } from '../../../context/LoadingContext.jsx';
import { apiFetch } from '../../../lib/api.js';

const Signup = () => {
	const navigate = useNavigate();
	// Read invite token from URL to adapt the form and payload
	const [invite, setInvite] = useState(null);
	useEffect(() => {
		try {
			const params = new URLSearchParams(window.location.search);
			const token = params.get('invite');
			setInvite(token || null);
			if (token) {
				try { localStorage.setItem('inviteToken', token); } catch {}
			}
		} catch {}
	}, []);
	const [form, setForm] = useState({
		name: '',
		last_name: '',
		email: '',
		password: '',
		address: ''
	});
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState(null);

	const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const { wrapPromise } = useLoading();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);
		wrapPromise(async () => {
			try {
				const payload = invite ? { ...form, address: form.address || undefined, invite } : form;
				const res = await apiFetch('/auth/signup', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || 'Erreur inscription');
				setMessage(data.message || 'Inscription réussie');
				// Redirige toujours vers la page de vérification courriel après création du compte
				setTimeout(() => navigate('/check-email'), 800);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		});
	};

	return (
		<div className="signup-wrapper">
			<div className="signup-card">
				<h2 className="signup-title">Inscription</h2>
				<p className="signup-subtitle">Crée ton compte pour accéder à la plateforme.</p>
				<form onSubmit={handleSubmit} className="signup-form">
					<div className="signup-row-two">
						<div className="signup-field">
							<label className="signup-label" htmlFor="name">Prénom</label>
							<input id="name" name="name" className="signup-input" placeholder="Prénom" value={form.name} onChange={onChange} required />
						</div>
						<div className="signup-field">
							<label className="signup-label" htmlFor="last_name">Nom</label>
							<input id="last_name" name="last_name" className="signup-input" placeholder="Nom" value={form.last_name} onChange={onChange} required />
						</div>
					</div>
					<div className="signup-field">
						<label className="signup-label" htmlFor="email">Email</label>
						<input id="email" type="email" name="email" className="signup-input" placeholder="Email" value={form.email} onChange={onChange} required />
					</div>
						<div className="signup-field">
						<label className="signup-label" htmlFor="password">Mot de passe</label>
						<input id="password" type="password" name="password" className="signup-input" placeholder="Mot de passe" value={form.password} onChange={onChange} required />
					</div>
					{!invite && (
						<div className="signup-field">
							<label className="signup-label" htmlFor="address">Adresse</label>
							<input id="address" name="address" className="signup-input" placeholder="Adresse" value={form.address} onChange={onChange} required />
						</div>
					)}
					<button type="submit" className="signup-submit" disabled={loading}>{loading ? 'En cours...' : 'Créer le compte'}</button>
					{error && <div className="signup-error" role="alert">{error}</div>}
					{message && <div className="signup-message" role="status">{message}</div>}
				</form>
				<button onClick={() => navigate('/login')} className="signup-alt-action">Déjà un compte ? Connexion</button>
			</div>
		</div>
	);
};

export default Signup;
