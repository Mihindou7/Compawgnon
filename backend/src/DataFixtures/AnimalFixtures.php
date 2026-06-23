<?php

namespace App\DataFixtures;

use App\Entity\Animal;
use App\Entity\AnimalMedia;
use App\Entity\Breed;
use App\Entity\Seller;
use App\Entity\Species;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class AnimalFixtures extends Fixture implements DependentFixtureInterface
{
    private const GEO = [
        'lyon'      => ['city' => 'Lyon',      'postal_code' => '69001', 'lat' => '45.7485',  'lng' => '4.8467',   'region' => 'Auvergne-Rhône-Alpes',       'department' => 'Rhône',             'department_code' => '69'],
        'grenoble'  => ['city' => 'Grenoble',  'postal_code' => '38000', 'lat' => '45.1879',  'lng' => '5.7269',   'region' => 'Auvergne-Rhône-Alpes',       'department' => 'Isère',             'department_code' => '38'],
        'paris'     => ['city' => 'Paris',     'postal_code' => '75001', 'lat' => '48.8566',  'lng' => '2.3522',   'region' => 'Île-de-France',              'department' => 'Paris',             'department_code' => '75'],
        'bordeaux'  => ['city' => 'Bordeaux',  'postal_code' => '33000', 'lat' => '44.8378',  'lng' => '-0.5792',  'region' => 'Nouvelle-Aquitaine',         'department' => 'Gironde',           'department_code' => '33'],
        'marseille' => ['city' => 'Marseille', 'postal_code' => '13001', 'lat' => '43.2965',  'lng' => '5.3698',   'region' => 'Provence-Alpes-Côte d\'Azur','department' => 'Bouches-du-Rhône',  'department_code' => '13'],
        'toulouse'  => ['city' => 'Toulouse',  'postal_code' => '31000', 'lat' => '43.6047',  'lng' => '1.4442',   'region' => 'Occitanie',                  'department' => 'Haute-Garonne',     'department_code' => '31'],
        'nantes'    => ['city' => 'Nantes',    'postal_code' => '44000', 'lat' => '47.2184',  'lng' => '-1.5536',  'region' => 'Pays de la Loire',           'department' => 'Loire-Atlantique',  'department_code' => '44'],
        'lille'     => ['city' => 'Lille',     'postal_code' => '59000', 'lat' => '50.6292',  'lng' => '3.0573',   'region' => 'Hauts-de-France',            'department' => 'Nord',              'department_code' => '59'],
        'strasbourg'=> ['city' => 'Strasbourg','postal_code' => '67000', 'lat' => '48.5734',  'lng' => '7.7521',   'region' => 'Grand Est',                  'department' => 'Bas-Rhin',          'department_code' => '67'],
        'rennes'    => ['city' => 'Rennes',    'postal_code' => '35000', 'lat' => '48.1173',  'lng' => '-1.6778',  'region' => 'Bretagne',                   'department' => 'Ille-et-Vilaine',   'department_code' => '35'],
    ];

    private const ANIMALS = [
        // ── Chiens éleveur ──────────────────────────────────────────────────
        [
            'seller' => UserFixtures::SELLER_BREEDER_REF,
            'species' => 'species-chien', 'breed' => 'breed-golden-retriever',
            'title' => 'Golden Retriever mâle 3 mois – Lof',
            'description' => 'Belle portée de Golden Retriever issus de parents Lof. Chiots élevés en famille, socialisés avec enfants et chats. Vaccinés, vermifugés, identifiés. Très beaux sujets avec un excellent caractère. Remise après 8 semaines avec carnet de santé complet.',
            'sex' => 'male', 'price' => 1200,
            'birthdate' => '-3 months', 'image' => '/uploads/animals/golden-retriever.jpg',
            'geo' => 'lyon',
        ],
        [
            'seller' => UserFixtures::SELLER_BREEDER_REF,
            'species' => 'species-chien', 'breed' => 'breed-golden-retriever',
            'title' => 'Golden Retriever femelle 3 mois – Lof',
            'description' => 'Femelle Golden Retriever de la même portée, tempérament exceptionnel. Parents testés dysplasie. Élevée en maison avec jardin. Documentation complète fournie. Idéale pour famille avec enfants.',
            'sex' => 'female', 'price' => 1200,
            'birthdate' => '-3 months', 'image' => '/uploads/animals/golden-retriever-2.jpg',
            'geo' => 'lyon',
        ],
        [
            'seller' => UserFixtures::SELLER_BREEDER_REF,
            'species' => 'species-chien', 'breed' => 'breed-labrador',
            'title' => 'Labrador chocolat mâle 10 semaines',
            'description' => 'Magnifique Labrador robe chocolat, très joueur et câlin. Parents connus, santé irréprochable. Primo-vaccination faite, puce électronique posée. Prêt pour une nouvelle famille aimante.',
            'sex' => 'male', 'price' => 900,
            'birthdate' => '-10 weeks', 'image' => '/uploads/animals/labrador-chocolat.jpg',
            'geo' => 'paris',
        ],
        [
            'seller' => UserFixtures::SELLER_BREEDER_REF,
            'species' => 'species-chien', 'breed' => 'breed-cavalier-king-charles',
            'title' => 'Cavalier King Charles tricolore 4 mois',
            'description' => 'Adorable Cavalier King Charles aux couleurs tricolores. Doux, calme, parfait pour appartement ou maison. Entente parfaite avec les enfants et les autres animaux. Suivi vétérinaire rigoureux.',
            'sex' => 'female', 'price' => 1500,
            'birthdate' => '-4 months', 'image' => '/uploads/animals/cavalier-king-charles.jpg',
            'geo' => 'bordeaux',
        ],
        // ── Chats éleveur ────────────────────────────────────────────────────
        [
            'seller' => UserFixtures::SELLER_BREEDER_REF,
            'species' => 'species-chat', 'breed' => 'breed-maine-coon',
            'title' => 'Maine Coon mâle 4 mois – LOOF',
            'description' => 'Superbe Maine Coon tabby silver, caractère exceptionnel. Parents présents et visibles. Élevé avec amour en maison, habitué aux enfants. Pedigree LOOF fourni, testé HCM négatif.',
            'sex' => 'male', 'price' => 1400,
            'birthdate' => '-4 months', 'image' => '/uploads/animals/maine-coon.jpg',
            'geo' => 'lyon',
        ],
        [
            'seller' => UserFixtures::SELLER_BREEDER_REF,
            'species' => 'species-chat', 'breed' => 'breed-british-shorthair',
            'title' => 'British Shorthair bleu femelle 3 mois',
            'description' => 'Chaton British Shorthair bleu typé, parents importés. Tempérament très doux, parfait pour famille. Carnet de santé complet, vaccins à jour, identification. Très beau sujet conforme au standard.',
            'sex' => 'female', 'price' => 1100,
            'birthdate' => '-3 months', 'image' => '/uploads/animals/british-shorthair.jpg',
            'geo' => 'marseille',
        ],
        // ── Animaux animalerie ────────────────────────────────────────────────
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-chien', 'breed' => 'breed-berger-allemand',
            'title' => 'Berger Allemand mâle 2 mois',
            'description' => 'Chiot Berger Allemand issu d\'une lignée de travail. Très vif, intelligent, prêt pour l\'éducation. Primo-vaccination et vermifuge effectués. Remis avec passeport européen et carnet de santé.',
            'sex' => 'male', 'price' => 800,
            'birthdate' => '-2 months', 'image' => '/uploads/animals/berger-allemand.jpg',
            'geo' => 'grenoble',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-chat', 'breed' => 'breed-persan',
            'title' => 'Persan blanc femelle 6 mois',
            'description' => 'Chatte Persane blanche au pelage soyeux, très douce et câline. Habituée à la vie d\'intérieur. Stérilisée, vaccinée, identifiée. Cherche foyer calme et aimant.',
            'sex' => 'female', 'price' => 600,
            'birthdate' => '-6 months', 'image' => '/uploads/animals/persan-blanc.jpg',
            'geo' => 'toulouse',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-lapin', 'breed' => 'breed-nain-de-hollande',
            'title' => 'Lapin Nain de Hollande fauve 3 mois',
            'description' => 'Adorable lapin nain fauve, très doux et apprivoisé. Habitué à être manipulé. Idéal pour les enfants. Livré avec cage de départ et sac de nourriture. Vacciné myxomatose et VHD.',
            'sex' => 'male', 'price' => 80,
            'birthdate' => '-3 months', 'image' => '/uploads/animals/lapin-nain.jpg',
            'geo' => 'nantes',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-lapin', 'breed' => 'breed-rex',
            'title' => 'Lapin Rex castor femelle 4 mois',
            'description' => 'Lapin Rex au pelage velours particulier. Très doux, aime les câlins. Bien socialisé depuis la naissance. Parfait animal de compagnie pour toute la famille.',
            'sex' => 'female', 'price' => 95,
            'birthdate' => '-4 months', 'image' => '/uploads/animals/lapin-rex.jpg',
            'geo' => 'grenoble',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-oiseau', 'breed' => 'breed-perruche',
            'title' => 'Perruche ondulée bleue mâle 5 mois',
            'description' => 'Perruche bleue baguée, apprivoisée et manipulée quotidiennement. Mange dans la main, très sociable. Peut être mise à la main facilement. Vendue avec cage et accessoires.',
            'sex' => 'male', 'price' => 45,
            'birthdate' => '-5 months', 'image' => '/uploads/animals/perruche.jpg',
            'geo' => 'lille',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-rongeur', 'breed' => 'breed-cochon-d-inde',
            'title' => 'Cobaye (cochon d\'inde) femelle 2 mois',
            'description' => 'Petit cochon d\'inde doux et apprivoisé. Parfait pour les enfants dès 6 ans. N\'est pas agressif, ne mord pas. Vendu avec son alimentation de départ et sa litière.',
            'sex' => 'female', 'price' => 35,
            'birthdate' => '-2 months', 'image' => '/uploads/animals/cobaye.jpg',
            'geo' => 'paris',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-reptile', 'breed' => 'breed-dragon-barbu',
            'title' => 'Dragon Barbu mâle 4 mois',
            'description' => 'Dragon Barbu élevé en captivité, parfaitement socialisé. Mange bien, très actif et curieux. Vendu avec son terrarium complet (lampe UV, chauffage, décor). Alimentation aux criquets et légumes.',
            'sex' => 'male', 'price' => 280,
            'birthdate' => '-4 months', 'image' => '/uploads/animals/dragon-barbu.jpg',
            'geo' => 'bordeaux',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-furet', 'breed' => 'breed-furet-domestique',
            'title' => 'Furet mâle castré 6 mois',
            'description' => 'Furet mâle castré et descenté, très joueur et affectueux. Habitué aux chiens et chats. Vacciné rage et maladie de Carré. Très beau sujet, coloris sable.',
            'sex' => 'male', 'price' => 150,
            'birthdate' => '-6 months', 'image' => '/uploads/species/furet.jpg',
            'geo' => 'marseille',
        ],
        // ── Annonces supplémentaires ──────────────────────────────────────────
        [
            'seller' => UserFixtures::SELLER_BREEDER_REF,
            'species' => 'species-chien', 'breed' => 'breed-labrador',
            'title' => 'Labrador jaune femelle 8 semaines',
            'description' => 'Chiotte Labrador jaune, douce et très câline. Parents à disposition sur place. Élevée en famille avec enfants et chats. Vaccination et identification réalisées. Caractère exceptionnel garanti.',
            'sex' => 'female', 'price' => 950,
            'birthdate' => '-8 weeks', 'image' => '/uploads/animals/labrador-jaune.jpg',
            'geo' => 'strasbourg',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-chat', 'breed' => 'breed-maine-coon',
            'title' => 'Maine Coon femelle tabby silver 5 mois',
            'description' => 'Magnifique Maine Coon femelle, très typée, tempérament de chien. Adore les câlins et joue volontiers. Vaccinée, identifiée, vermifugée. Parents visibles en boutique.',
            'sex' => 'female', 'price' => 1300,
            'birthdate' => '-5 months', 'image' => '/uploads/animals/maine-coon.jpg',
            'geo' => 'grenoble',
        ],
        [
            'seller' => UserFixtures::SELLER_BREEDER_REF,
            'species' => 'species-chat', 'breed' => 'breed-persan',
            'title' => 'Persan bleu et blanc mâle 4 mois',
            'description' => 'Chaton Persan aux yeux cuivrés, très doux et calme. Élevé avec d\'autres chats et des enfants. Pedigree disponible, tests génétiques effectués. Idéal pour foyer tranquille.',
            'sex' => 'male', 'price' => 900,
            'birthdate' => '-4 months', 'image' => '/uploads/animals/persan.jpg',
            'geo' => 'toulouse',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-rongeur', 'breed' => 'breed-hamster-syrien',
            'title' => 'Hamster Syrien doré femelle 2 mois',
            'description' => 'Jeune hamster syrien doré, très active et curieuse. Déjà apprivoisée, mange dans la main. Vendue avec sa cage équipée, roue, maison et nourriture de départ.',
            'sex' => 'female', 'price' => 25,
            'birthdate' => '-2 months', 'image' => '/uploads/animals/hamster.jpg',
            'geo' => 'nantes',
        ],
        [
            'seller' => UserFixtures::SELLER_SHOP_REF,
            'species' => 'species-reptile', 'breed' => 'breed-gecko-leopard',
            'title' => 'Gecko léopard femelle 3 mois – morphe tangerine',
            'description' => 'Gecko léopard femelle morphe tangerine, superbe coloration orangée. Très facile à maintenir et à manipuler. Idéal pour débuter avec les reptiles. Vendu avec terrarium et équipements.',
            'sex' => 'female', 'price' => 120,
            'birthdate' => '-3 months', 'image' => '/uploads/animals/gecko.jpg',
            'geo' => 'lille',
        ],
        [
            'seller' => UserFixtures::SELLER_BREEDER_REF,
            'species' => 'species-lapin', 'breed' => 'breed-nain-de-hollande',
            'title' => 'Lapin nain de Hollande noir et blanc 3 mois',
            'description' => 'Charmant petit lapin nain bicolore, très expressif. Déjà habitué à être sorti de sa cage et à être caressé. Vacciné et vermifugé. Parfait pour les petits espaces.',
            'sex' => 'unknown', 'price' => 75,
            'birthdate' => '-3 months', 'image' => '/uploads/animals/lapin-nain.jpg',
            'geo' => 'rennes',
        ],
    ];

    public function load(ObjectManager $em): void
    {
        $publishedAt = new \DateTimeImmutable('-10 days');

        foreach (self::ANIMALS as $i => $data) {
            /** @var \App\Entity\Seller $seller */
            $seller  = $this->getReference($data['seller'], Seller::class);
            $species = $this->getReference($data['species'], Species::class);
            $breed   = $this->getReference($data['breed'], Breed::class);
            $geo     = self::GEO[$data['geo']];

            $animal = new Animal();
            $animal->setSeller($seller);
            $animal->setSpecies($species);
            $animal->setBreed($breed);
            $animal->setTitle($data['title']);
            $animal->setDescription($data['description']);
            $animal->setSex($data['sex']);
            $animal->setPrice((string) $data['price']);
            $animal->setCity($geo['city']);
            $animal->setPostalCode($geo['postal_code']);
            $animal->setLatitude($geo['lat']);
            $animal->setLongitude($geo['lng']);
            $animal->setRegion($geo['region']);
            $animal->setDepartment($geo['department']);
            $animal->setDepartmentCode($geo['department_code']);
            $animal->setBirthdate(new \DateTimeImmutable($data['birthdate']));
            $animal->setStatus('published');
            $animal->setPublishedAt($publishedAt->modify('-' . ($i * 2) . ' hours'));

            $em->persist($animal);

            if (!empty($data['image'])) {
                $media = new AnimalMedia();
                $media->setAnimal($animal);
                $media->setFileUrl($data['image']);
                $media->setMimeType('image/jpeg');
                $media->setPosition(0);
                $media->setIsCover(true);
                $em->persist($media);
            }

            $this->addReference('animal-' . $i, $animal);
        }

        $em->flush();
    }

    public function getDependencies(): array
    {
        return [UserFixtures::class, SpeciesBreedFixtures::class];
    }
}
