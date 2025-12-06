Campus Room est un système de réservation de salles de classe et d'espaces d'étude basé sur React, conçu pour les institutions éducatives. Le projet est actuellement en phase de développement (PFE - Projet de Fin d'Études) et suit une architecture basée sur les composants React avec une séparation claire entre les rôles utilisateurs (Admin, Professeur, Étudiant). Le système inclut l'authentification, un tableau de bord personnalisé par rôle, et une gestion complète des réservations avec vue calendrier et responsive design.

Points Fonctionnels Principaux
Système d'authentification avec contrôle d'accès basé sur les rôles (Admin, Professeur, Étudiant)
Tableaux de bord personnalisés pour chaque rôle avec statistiques pertinentes
Fonctionnalité de réservation de salles de classe et d'espaces d'étude
Vue calendrier pour les horaires et les réservations
Design réactif et adapté aux appareils mobiles
Composants partagés et réutilisables pour les vues communes
Pile Technologique
Frontend: React.js avec hooks personnalisés et contextes
Backend: Java (29.8%)
Styles: CSS (13.9%)
Package Manager: npm ou yarn
Environnement: Node.js (v14 ou supérieur)
Build: Webpack
Licence
Licencié sous la licence MIT - permissive et libre d'utilisation commerciale et personnelle

Pour configurer et exécuter le projet Campus Room localement sur votre environnement de développement, suivez ces étapes :

Prérequis
Avant de commencer, assurez-vous d'avoir installé les éléments suivants :

Node.js (version 14 ou supérieure)
npm ou yarn (gestionnaires de paquets)
Git (pour cloner le dépôt)
Étapes de Configuration
Cloner le dépôt
Ouvrez votre terminal et exécutez la commande suivante pour cloner le dépôt :

Copier
git clone https://github.com/Azeddinedehmani/projet-de-pfe.git
Naviguer dans le répertoire du projet
Accédez au dossier du projet :

Copier
cd projet-de-pfe
Installer les dépendances
Utilisez npm ou yarn pour installer les dépendances nécessaires. Choisissez l'une des deux commandes ci-dessous :

Avec npm :
Copier
npm install
Avec yarn :
Copier
yarn install
Configurer les variables d'environnement
Créez un fichier .env à la racine du projet et configurez les variables d'environnement nécessaires (comme les informations de connexion à la base de données, API, etc.). Consultez la documentation du projet ou le fichier .env.example pour les variables requises.

Démarrer le serveur de développement
Une fois les dépendances installées et les variables d'environnement configurées, démarrez le serveur de développement :

Avec npm :
Copier
npm start
Avec yarn :
Copier
yarn start
Accéder à l'application
Ouvrez votre navigateur et allez à l'adresse suivante :

Copier
http://localhost:3000
Étapes supplémentaires
Construire le projet pour la production (si nécessaire) :

Copier
npm run build
ou

Copier
yarn build
Exécuter des tests (si des tests sont inclus) :

Copier
npm test
ou

Copier
yarn test
Résolution des problèmes
Si vous rencontrez des problèmes lors de l'installation ou de l'exécution, vérifiez les messages d'erreur dans le terminal et assurez-vous que toutes les dépendances sont correctement installées. Vous pouvez également consulter la section "Issues" du dépôt GitHub pour des solutions potentielles.

Conclusion
Vous devriez maintenant être en mesure d'exécuter le projet Campus Room localement. Si vous avez des questions supplémentaires, n'hésitez pas à consulter la documentation du projet ou à poser des questions sur le dépôt GitHub.
