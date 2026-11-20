export type Project = {
  id: string;
  title: string;
  category: "Illustration" | "Affiche" | "Étude visuelle";
  description: string;
  image: string;
  alt: string;
  color: string;
};

const catalog: Omit<Project, "image">[] = [
  {
    id: "maree-basse",
    title: "Marée basse",
    category: "Illustration",
    description: "Une côte vue d’en haut, à l’instant où l’eau se retire. Les aplats d’encre et les traces d’écume donnent à la rencontre entre la terre et la mer le rythme d’une gravure.",
    alt: "Un rivage orange en diagonale dans une mer bleu profond, ponctuée d’écume blanche.",
    color: "#173658",
  },
  {
    id: "jardin-de-pluie",
    title: "Jardin de pluie",
    category: "Illustration",
    description: "Après l’averse, les feuilles reprennent toute leur place. Trois fleurs claires émergent d’un feuillage peint à la gouache, entre ombres de mousse et éclats de jaune.",
    alt: "Trois lys crème sur un tapis de grandes feuilles émeraude.",
    color: "#354c2e",
  },
  {
    id: "ville-suspendue",
    title: "Ville suspendue",
    category: "Illustration",
    description: "L’escalier suit le relief d’un quartier imaginaire. Découpées dans le papier, les façades se répondent par leurs couleurs, et les ombres bleues tracent un second chemin à travers la scène.",
    alt: "Un escalier ocre serpente entre des façades pêche aux ombres bleues.",
    color: "#ce8065",
  },
  {
    id: "frequences",
    title: "Fréquences",
    category: "Affiche",
    description: "Une affiche qui donne une forme au son. Les cercles se décalent légèrement à chaque répétition, comme deux passages d’encre en risographie.",
    alt: "Des anneaux concentriques rouges et roses rayonnent autour d’un centre noir.",
    color: "#e64d52",
  },
  {
    id: "lheure-bleue",
    title: "L’Heure bleue",
    category: "Illustration",
    description: "Entre la fin du jour et la tombée de la nuit, une fenêtre allumée suffit à donner une échelle à la ville. La composition joue sur la profondeur de quelques bleus et la chaleur d’un seul rectangle.",
    alt: "Une fenêtre ambrée brille dans un immeuble bleu au crépuscule.",
    color: "#343f84",
  },
  {
    id: "terres-hautes",
    title: "Terres hautes",
    category: "Illustration",
    description: "Des crêtes sèches et des herbes rases sous un soleil pâle. Les couches de pastel séparent les reliefs, du premier plan rugueux jusqu’aux montagnes qui se fondent dans le ciel.",
    alt: "Des crêtes de terre cuite, des herbes sèches et un soleil ivoire.",
    color: "#c57c56",
  },
  {
    id: "formes-vives",
    title: "Formes vives",
    category: "Affiche",
    description: "Des formes découpées s’emboîtent comme les pièces d’un mobile. Un disque orange déplace l’équilibre de l’ensemble, parmi les courbes imprimées en bleu.",
    alt: "Des courbes cobalt s’entrelacent autour d’un disque orange sur fond crème.",
    color: "#393e97",
  },
  {
    id: "entre-les-lignes",
    title: "Entre les lignes",
    category: "Étude visuelle",
    description: "Un motif se construit à partir de traits presque identiques. Leur inclinaison progressive courbe la surface, tandis qu’un filet olive traverse le dessin.",
    alt: "Des lignes noires et crème dessinent une trame ondulée traversée d’un trait olive.",
    color: "#c6bda3",
  },
  {
    id: "eaux-calmes",
    title: "Eaux calmes",
    category: "Illustration",
    description: "Deux nageurs vus à la verticale traversent un bassin. Les reflets se superposent en couches de vert et la courbe du bord fait écho aux ondulations de l’eau.",
    alt: "Deux nageurs dans une piscine vert jade aux reflets menthe, vus du dessus.",
    color: "#4f8e73",
  },
  {
    id: "chambre-solaire",
    title: "Chambre solaire",
    category: "Affiche",
    description: "Une chaise rouge, une fenêtre ronde et la lumière de l’après-midi. L’ombre allongée partage la pièce en aplats, comme sur une affiche imprimée à la main.",
    alt: "Une chaise rouge projette une longue ombre dans une pièce jaune.",
    color: "#d7a84e",
  },
  {
    id: "nuit-papier",
    title: "Nuit de papier",
    category: "Étude visuelle",
    description: "Le grain de la lithographie laisse affleurer la lumière de la lune. Au premier plan, une silhouette de pin se détache dans des noirs irréguliers.",
    alt: "Une grande lune ivoire derrière la silhouette noire d’un pin dans un ciel indigo.",
    color: "#222745",
  },
  {
    id: "herbier-mineral",
    title: "Herbier minéral",
    category: "Étude visuelle",
    description: "Ce petit inventaire associe la souplesse des fougères aux cassures des minéraux. Les pièces se rejoignent sur le papier, comme dans un collage à partir d’objets récoltés.",
    alt: "Des fragments minéraux violets et des fougères vert acide sur fond lilas.",
    color: "#9b7dba",
  },
];

export const projects: Project[] = catalog.map((project) => ({
  ...project,
  image: `/projets/${project.id}.webp`,
}));

export const categories = Array.from(
  new Set(projects.map(({ category }) => category)),
);

export function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}
