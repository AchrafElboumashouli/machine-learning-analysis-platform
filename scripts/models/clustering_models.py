from sklearn.cluster import KMeans
from models.base_model import BaseModel


# ==============================
# K-MEANS
# ==============================
class KMeansModel(BaseModel):
    def __init__(self, k=3):
        super().__init__("K-Means")
        self.model = KMeans(
            n_clusters=k,
            random_state=42,
            n_init=10
        )

    def fit(self, X, y=None):
        self.model.fit(X)

    def predict(self, X):
        return self.model.predict(X)


# ==============================
# FACTORY
# ==============================
def get_clustering_model(name: str, n_clusters: int = None):
    if name == "K-Means":
        # Use provided n_clusters or default to 3, ensure it's between 2 and 10
        k = n_clusters if n_clusters is not None else 3
        k = max(2, min(10, k))  # Constrain to valid range
        return KMeansModel(k=k)

    raise ValueError("Unknown clustering model")
