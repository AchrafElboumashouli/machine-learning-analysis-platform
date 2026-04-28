from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier

from models.base_model import BaseModel


# ==============================
# LOGISTIC REGRESSION
# ==============================
class LogisticRegressionModel(BaseModel):
    def __init__(self):
        super().__init__("Logistic Regression")
        self.model = LogisticRegression(max_iter=1000)

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)


# ==============================
# KNN
# ==============================
class KNNModel(BaseModel):
    def __init__(self, k=5):
        super().__init__("KNN")
        self.model = KNeighborsClassifier(n_neighbors=k)

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)


# ==============================
# DECISION TREE
# ==============================
class DecisionTreeModel(BaseModel):
    def __init__(self):
        super().__init__("Decision Tree")
        self.model = DecisionTreeClassifier(random_state=42)

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)


# ==============================
# RANDOM FOREST
# ==============================
class RandomForestClassificationModel(BaseModel):
    def __init__(self, n_estimators=100):
        super().__init__("Random Forest")
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            random_state=42
        )

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)


# ==============================
# SVM
# ==============================
class SVMModel(BaseModel):
    def __init__(self):
        super().__init__("SVM")
        self.model = SVC(kernel="rbf", probability=True)

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)

# ==============================
# NAIVE BAYES
# ==============================
class NaiveBayesModel(BaseModel):
    def __init__(self):
        super().__init__("Naive Bayes")
        self.model = GaussianNB()

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)

# ==============================
# MLP CLASSIFIER (Neural Networks)
# ==============================
class MLPClassificationModel(BaseModel):
    def __init__(self, hidden_layer_sizes=(100, 50), max_iter=1000):
        super().__init__("MLP Classifier")
        self.model = MLPClassifier(
            hidden_layer_sizes=hidden_layer_sizes,
            max_iter=max_iter,
            random_state=42,
            warm_start=False,
            learning_rate_init=0.001,
            alpha=0.0001
        )

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)


# ==============================
# FACTORY
# ==============================
def get_classification_model(name: str):
    if name == "Logistic Regression":
        return LogisticRegressionModel()

    if name == "KNN":
        return KNNModel()

    if name == "Decision Tree" or name == "Decision Tree Classifier":
        return DecisionTreeModel()

    if name == "Random Forest (Classifier)":
        return RandomForestClassificationModel()

    if name == "SVM":
        return SVMModel()

    if name == "Naive Bayes":
        return NaiveBayesModel()

    if name == "MLP Classifier":
        return MLPClassificationModel()

    raise ValueError(f"Unknown classification model: {name}")
