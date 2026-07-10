# Tests de securite documentes

Ce document decrit les controles de securite effectivement couverts par les tests automatises du projet Compawgnon.

## Perimetre

Les tests portent sur :

- l'API Symfony ;
- le frontend Next.js ;
- les acces par role : utilisateur, vendeur, administrateur ;
- la validation des formulaires ;
- la gestion des tokens JWT.

## Outils utilises

| Outil | Usage |
|---|---|
| PHPUnit | Tester le backend : API, authentification, autorisations, regles metier |
| Vitest | Tester le frontend : validation des formulaires, client API, gestion des tokens |

## Environnement de test

| Element | Valeur |
|---|---|
| Application | Compawgnon |
| Backend | Symfony API REST |
| Frontend | Next.js |
| Base de donnees principale | MySQL |
| Authentification | JWT + refresh token |
| Environnement cible | Local / environnement de test automatise |
| Date d'execution | 06/07/2026 |
| Testeur | MIHINDOU Naomi, avec verification assistee par Codex |

## Comptes de test

Les comptes doivent correspondre aux fixtures ou aux comptes crees pour la campagne de test.

| Role | Email | Usage |
|---|---|---|
| Utilisateur | `marie@example.com` ou utilisateur fixture equivalent | Tester les routes utilisateur |
| Vendeur approuve | `elevage@compawgnon.fr` ou vendeur fixture equivalent | Tester les routes vendeur |
| Vendeur non approuve | `vendeur-pending@compawgnon.fr` ou vendeur fixture equivalent | Verifier le blocage des actions vendeur |
| Administrateur | `admin@compawgnon.fr` ou administrateur fixture equivalent | Tester les routes d'administration |

## Tests backend automatises

| ID | Scenario | Outil | Resultat attendu | Resultat obtenu | Statut |
|---|---|---|---|---|---|
| SEC-API-01 | Acceder a `/api/me` sans token | PHPUnit | `401 Unauthorized` | Valide par `UserControllerTest::testGetProfilSansToken` | OK |
| SEC-API-02 | Acceder a `/api/admin/users` sans token | PHPUnit | `401 Unauthorized` | Valide par `AdminControllerTest::testAccesRefuseSansToken` | OK |
| SEC-API-03 | Acceder a `/api/admin/users` avec un utilisateur simple | PHPUnit | `403 Forbidden` | Valide par `AdminControllerTest::testAccesRefuseNonAdmin` | OK |
| SEC-API-04 | Acceder a `/api/seller/animals` avec un utilisateur simple | PHPUnit | `403 Forbidden` | Valide par `AnimalSellerControllerTest::testListeAnimauxRefuseBuyer` | OK |
| SEC-API-05 | Se connecter avec un mauvais mot de passe | PHPUnit | `401 Unauthorized` | Valide par `AuthControllerTest::testLoginMauvaisMotDePasse` | OK |
| SEC-API-06 | Utiliser un refresh token invalide ou expire | PHPUnit | `401 Unauthorized` | Valide par `AuthControllerTest::testRefreshTokenExpire` et `testLogoutInvalidationRefreshToken` | OK |
| SEC-API-09 | Laisser un avis sur une reservation non terminee | PHPUnit | `422 Unprocessable Entity` | Valide par `ReviewControllerTest::testCreerAvisReservationNonTerminee` | OK |
| SEC-API-10 | Laisser un avis sur la reservation d'un autre utilisateur | PHPUnit | `403 Forbidden` | Valide par `ReviewControllerTest::testCreerAvisReservationAutreBuyer` | OK |
| SEC-API-11 | Envoyer une note d'avis egale a `6` | PHPUnit | `422 Unprocessable Entity` | Valide par `ReviewControllerTest::testCreerAvisNoteHorsPlage` | OK |
| SEC-API-13 | Modifier une annonce appartenant a un autre vendeur | PHPUnit | `403` ou `404` selon la route | Valide par `AnimalSellerControllerTest::testDetailAnnonceAutreVendeur` et `testArchiverAnnonceAutreVendeur` | OK |
| SEC-API-14 | Depasser 5 tentatives de login echouees sur `/api/auth/login` (meme couple email+IP) | PHPUnit | `401` avec message de blocage, meme avec le bon mot de passe a la 6e tentative | Valide par `AuthControllerTest::testLoginBloqueApresTropDeTentativesEchouees` | OK |
| SEC-API-15 | Injecter `<script>` dans un message de contact/reservation transmis par email (templates Twig) | PHPUnit | Le HTML genere echappe la balise (`&lt;script&gt;`), aucune balise executable dans la sortie | Valide par `MailTemplateXssTest::testReponseContactEchappeLeContenuUtilisateur` et `testDemandeReservationEchappeLeMessageAcheteur` | OK |
| SEC-API-16 | Envoyer une tautologie SQL (`' OR '1'='1`) dans le champ email du login | PHPUnit | `401 Unauthorized`, pas d'authentification, pas d'erreur serveur | Valide par `AuthControllerTest::testLoginPayloadInjectionSqlEmailRefuse` | OK |
| SEC-API-17 | Envoyer une tautologie SQL dans le champ de recherche `q` du catalogue | PHPUnit | `200 OK`, 0 resultat, l'annonce draft ne remonte pas | Valide par `CataloguePublicTest::testRechercheAvecPayloadInjectionSqlNeBypassePasLeFiltre` | OK |
| SEC-API-18 | Envoyer un payload destructeur (`'; DROP TABLE animals; --`) dans les filtres `q`, `city`, `postal_code`, `region`, `seller_type` du catalogue | PHPUnit | `200 OK` sur chaque filtre, la table `animals` et les donnees restent intactes ensuite | Valide par `CataloguePublicTest::testRechercheAvecPayloadInjectionSqlDestructifNeCassePasLaBase` | OK |

## Tests frontend automatises

| ID | Scenario | Outil | Resultat attendu | Resultat obtenu | Statut |
|---|---|---|---|---|---|
| SEC-FRONT-01 | Soumettre le formulaire d'inscription avec un email invalide | Vitest | Message d'erreur de validation | Valide par `RegisterForm.test.tsx` et `auth.schema.test.ts` | OK |
| SEC-FRONT-02 | Soumettre un mot de passe trop faible | Vitest | Message d'erreur de validation | Valide par `RegisterForm.test.tsx` et `auth.schema.test.ts` | OK |
| SEC-FRONT-03 | Soumettre une candidature vendeur avec un SIRET invalide | Vitest | Message d'erreur de validation | Valide par `profile.schema.test.ts` | OK |
| SEC-FRONT-04 | Creer une annonce avec une description trop courte | Vitest | Message d'erreur de validation | Valide par `animal.schema.test.ts` | OK |
| SEC-FRONT-05 | Simuler un token expire | Vitest | Deconnexion ou refresh automatique | Valide par `auth.store.test.ts` et `client.test.ts` | OK |
| SEC-FRONT-06 | Afficher un avis public contenant `<script>` ou une balise `<img onerror>` (commentaire et nom d'acheteur) | Vitest | Contenu affiche comme texte brut echappe, aucun noeud `<script>`/`<img>` cree dans le DOM | Valide par `TestimonialsSection.test.tsx` | OK |
| SEC-FRONT-07 | Verifier les attributs du cookie de session (`access_token`/`refresh_token`) poses par `setTokens`/`clearTokens` | Vitest | `SameSite=Strict`, `path=/`, max-age corrects (1h / 30j), `Secure` present en HTTPS et absent en HTTP | Valide par `tokens.test.ts` (bloc "attributs de securite du cookie") | OK |

## Points de controle deja couverts par les tests automatises

Le projet contient deja des tests automatises qui couvrent plusieurs aspects de securite fonctionnelle :

- acces refuse sans token ;
- acces refuse avec un role insuffisant ;
- compte desactive refuse lors de l'utilisation du token ;
- refresh token invalide ou expire refuse ;
- logout invalidant le refresh token ;
- email non verifie bloque pour certaines actions ;
- vendeur non approuve bloque pour la creation d'annonces ;
- avis interdit sur une reservation non terminee ;
- avis interdit sur une reservation appartenant a un autre utilisateur ;
- blocage du login apres 5 tentatives echouees (rate limiting par email+IP) ;
- echappement HTML du contenu utilisateur dans les emails (templates Twig autoescape) ;
- echappement HTML du contenu utilisateur affiche sur le site public (avis, temoignages) ;
- resistance a l'injection SQL sur le login et les filtres de recherche du catalogue (Doctrine QueryBuilder parametre) ;
- attributs de securite corrects sur les cookies de session (SameSite, Secure conditionnel, max-age) ;
- validation frontend des emails, mots de passe, SIRET, codes postaux et descriptions.

Ces tests automatises apportent une preuve de controle sur les principales regles d'authentification, d'autorisation et de validation.

## Conclusion

Compawgnon dispose deja de protections applicatives importantes : authentification JWT, controle d'acces par roles, validation des donnees, mots de passe haches et tests automatises sur plusieurs regles sensibles.