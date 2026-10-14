# Vérification du déploiement — 8 octobre 2026

## Constats

- Les commits efe4af4 et cd9953d ne changent que index.html : erreurs OCR, lecture PDF à la demande et décodage des photos mobiles. Aucune dépendance Python ni étape de build n'y est modifiée.
- Lors de cette vérification, le HTML public https://mr-dmi-1.onrender.com/ est identique octet pour octet à index.html du commit 9a7066ad86fe5a806702839b607a2dc57bda4815 (version 2026-10-07.15). Les correctifs OCR cités et les améliorations ultérieures sont donc déjà présents dans la page servie. Cela ne vérifie pas une ancienne fenêtre de déploiement ni le cache d'un téléphone.
- Les statuts GitHub des deux commits cités ne fournissent aucun journal Render. Le tableau de bord Render demande une connexion dans cette session.
- Installation propre de requirements.txt réussie sous Python 3.12. Les tests existants passent.
- Avant correction, `gunicorn --check-config app:app` échoue avec `Failed to find attribute 'app' in 'app'`. `app:A` réussit. La documentation Flask de Render propose `app:app` : https://render.com/docs/deploy-flask.

## Cause possible, non confirmée

Une commande de démarrage visant `app:app` au lieu de `app:A` constitue un défaut reproductible. Sans la commande et les lignes précédant « Exited with status 1 » dans les logs du 7 octobre, on ne peut pas attribuer les trois échecs à ce défaut. Un échec pendant l'installation/build aurait une autre cause. Le code de sortie 1 seul ne permet pas de trancher.

## Correctif

- Alias WSGI `app = A`, compatible avec les deux commandes, sans changer les routes ou le moteur OCR.
- Configuration explicite dans render.yaml : installation et tests Python pendant le build ; Gunicorn lié au port fourni par Render ; contrôle `/healthz`.
- `/healthz` publie uniquement le statut et RENDER_GIT_COMMIT (ou « unknown » hors Render) pour vérifier la révision effectivement déployée.
- Tests de non-régression OCR hors ligne : décodage/redimensionnement, image invalide, fichier illisible, image vide, canvas indisponible, erreurs non détaillées, PDF texte sans worker OCR, PDF scanné, dossier périmé et limite de pages.
- Workflow GitHub Actions : tests Python, cibles Gunicorn, identification JavaScript et tests OCR.

Un render.yaml ajouté au dépôt ne reconfigure pas automatiquement un service créé manuellement. Ne pas créer un deuxième service : contrôler les paramètres du service existant dans Render. La commande de build attendue est `pip install -r requirements.txt && python -m unittest test_engine test_identification test_api test_deployment && gunicorn --check-config app:app`. La commande de démarrage attendue est `gunicorn --bind 0.0.0.0:$PORT app:app`.

## Validation et limites

18 tests Python et suites JavaScript réussis ; démarrage réel Gunicorn et réponse HTTP locale vérifiés. Les tests OCR utilisent des simulations navigateur et des données fictives : ils ne mesurent ni la qualité de reconnaissance réelle ni la compatibilité Samsung. Les conditions cliniques ne sont pas modifiées. Un statut Render « Live » et une révision concordante sur `/healthz` restent les preuves du nouveau déploiement.


## Branche de préparation — 13 octobre 2026

Branche : feat/manufacturer-formal-mri-20261013 ; base ffc2101.
Version du shell : 2026-10-13.19 (cache renouvelé pour index.html et identification.js).

Changements : notices exactes fabricant avant portails et guides généraux ; recherche
fabricant lancée avant recherche complémentaire GUDID ; conclusion formelle et actions
à vérifier/ajuster dans les synthèses affichées, imprimables et exportées. Relevé manuel
par composant du classement MR Safe / MR Conditional / MR Unsafe, de la notice, de sa
version, de ses pages, du pays, des conditions et des restrictions. Un MR Unsafe déclaré
bloque le parcours ; il reste à documenter. Aucun résumé incomplet ne devient compatible.

Le moteur distingue le classement documentaire déclaré de la conclusion d’examen.
Les attestations transmises à /api/compare sont des déclarations utilisateur, sans
vérification indépendante de la notice : compatibility_established et scan_authorized
restent false, même avec toutes les valeurs numériques respectées. Le catalogue ne
récupère pas automatiquement l’intégralité des notices actuelles. Ce changement prépare
la présentation formelle ; il ne constitue pas un moteur clinique complet ni une couverture
universelle des DMI. Ne pas remplacer un manuel applicable par un résumé ancien.

Validation locale : 24 tests Python ; suites identification JavaScript, OCR mobile simulé,
cache hors ligne ; vérification des deux cibles Gunicorn. Les scénarios vérifient notamment
conditions manquantes, notice absente, inventaire incomplet, MR Unsafe et valeurs invalides.
Les tests simulés ne remplacent pas l’essai Samsung avec cartes et PDF anonymisés.

Préparation Render : utiliser d’abord une instance de prévisualisation ou de recette liée
à cette branche, sans changer la branche du service de production. Commandes conservées
dans render.yaml : pip install -r requirements.txt puis tests Python et contrôle WSGI ;
démarrage gunicorn --bind 0.0.0.0:$PORT app:app ; health check /healthz.
Vérifier les paramètres réels si le service a été créé manuellement. Aucun déploiement
Render n’est attesté par les seuls tests locaux ou par un commit GitHub.

Recette : /healthz doit montrer le SHA testé ; tester photo, PDF texte et scanné, saisie
manuelle, composants multiples, dépassement SAR, MR Unsafe déclaré, nouvelle saisie qui
invalide la synthèse, Nouveau dossier, impressions/exports et relance PWA après mise à jour.
La recherche GUDID est complémentaire : son statut MRI n’autorise jamais une conclusion.
Un passage en production nécessite cette recette ; conserver le SHA de production pour
un retour arrière et renouveler la version du cache lors de tout futur correctif du shell.

## Préparation — précautions de base, 14 octobre 2026

Rubrique indépendante de questions courantes, filtrée localement par mots-clés :
prothèses articulaires, opérations et matériels, aides auditives externes / implants,
objets personnels, dents, corps étrangers, dispositifs thérapeutiques, patchs,
protection auditive et matériel accompagnant. Réponses sourcées FDA / NHS,
consultées le 14 octobre 2026. Aucun classement individuel ni autorisation déduit
de ces fiches. Recherche limitée aux fiches disponibles, sans réponse générative.
Cache du shell : 2026-10-14.21. Vérifier la lisibilité sur Samsung, la recherche
avec accents, les cas inconnus et le fonctionnement hors ligne en recette.
Le moteur de comparaison et ses règles restent inchangés.

MR Unsafe déclaré : blocage conservateur même sans preuve documentaire complète,
avec conclusion explicite dans les deux parcours. Le classement documentaire reste
non établi tant que les preuves manquent. 25 tests Python et suites JavaScript
réussis, dont régression Unsafe sans notice et recherche des précautions.

## Sources complémentaires SecuriRM — préparation du 14 octobre 2026

Deux onglets documentaires distincts : notices fabricants et SecuriRM.
La recherche SecuriRM est déclenchée explicitement par l’utilisateur et envoie
uniquement marque et référence via les endpoints publics du site. Ce ne sont
pas des endpoints contractuels documentés : une modification, une indisponibilité
ou un format inconnu produit une erreur explicite, jamais une conclusion clinique.
Aucune réplication du catalogue ni téléchargement de notices. Indication source,
champ textuel, fabricant, catégorie et date de consultation sont présentés à part.
Aucune donnée SecuriRM ne modifie les règles ni les synthèses du moteur fabricant.
Le 14 octobre 2026, l’accueil public et les pictogrammes sont accessibles, mais
/block/q et /block/q-suggestions répondent HTTP 500. Aucun résultat réel ni
taux de couverture n’est donc validé. Les tests de résultats utilisent des
fixtures fictives ; la recette réelle valide seulement l’erreur et l’isolation.
Une intégration de résultats pleinement validée attend le rétablissement du
site ou une interface officielle fournie par SecuriRM. Cache 2026-10-14.22.
