import React, { useEffect, useState } from 'react';
import './checkEmail.css';
import { Link } from 'react-router-dom';

export default function CheckEmail() {
	const [seconds, setSeconds] = useState(0);
	useEffect(() => {
		const id = setInterval(() => setSeconds(s => s + 1), 1000);
		return () => clearInterval(id);
	}, []);

	return (
		<main className="check-email-wrapper">
			<div className="check-email-card">
				<h1 className="check-email-title">Vérification du courriel</h1>
				<p className="check-email-text">
					Nous avons envoyé un lien de confirmation à votre adresse. Ouvrez votre boîte de réception et cliquez sur le lien pour activer votre compte.
				</p>
				<p className="check-email-text subtle">
					Temps écoulé&nbsp;: <strong>{seconds}s</strong>
				</p>
				<p className="check-email-hint">
					Si vous ne voyez rien après <strong>30 secondes</strong>, vérifiez le dossier <strong>Pourriel / Spam</strong>. Certains fournisseurs classent ces courriels automatiquement.
				</p>
				<ul className="check-email-tips">
					<li>Actualisez votre boîte de réception.</li>
					<li>Ajoutez l’adresse d’expéditeur à vos contacts pour éviter le spam.</li>
					<li>Vous avez fait une erreur d’email ? <Link to="/signup" className="inline-link">Recréez un compte</Link>.</li>
				</ul>
				<div className="check-email-actions">
					<Link to="/login" className="check-email-btn">Se connecter</Link>
				</div>
			</div>
		</main>
	);
}

