from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.svm import SVR
from sklearn.neural_network import MLPRegressor

from models.base_model import BaseModel



# ==============================
# LINEAR REGRESSION
# ==============================

class LinearRegressionModel(BaseModel):
    def __init__(self):
        super().__init__("Linear Regression")
        self.model = LinearRegression()

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)

# ==============================
# RANDOM FOREST REGRESSOR
# ==============================


class RandomForestRegressionModel(BaseModel):
    def __init__(self, n_estimators=100):
        super().__init__("Random Forest Regressor")
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            random_state=42
        )

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)
    

# ==============================
# KNN REGRESSOR
# ==============================


class KNNRegressionModel(BaseModel):
    def __init__(self, n_neighbors=5):
        super().__init__("KNN Regressor")
        self.model = KNeighborsRegressor(
            n_neighbors=n_neighbors
        )

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)

# ==============================
# DECISION TREE REGRESSOR
# ==============================


class DecisionTreeRegressionModel(BaseModel):
    def __init__(self, max_depth=None):
        super().__init__("Decision Tree Regressor")
        self.model = DecisionTreeRegressor(
            max_depth=max_depth,
            random_state=42
        )

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)

# ==============================
# SVM REGRESSOR (SVR)
# ==============================

class SVRRegressionModel(BaseModel):
    def __init__(self, kernel="rbf", C=1.0, epsilon=0.1):
        super().__init__("SVR")
        self.model = SVR(
            kernel=kernel,
            C=C,
            epsilon=epsilon
        )

    def fit(self, X, y):
        self.model.fit(X, y)

    def predict(self, X):
        return self.model.predict(X)

# ==============================
# MLP REGRESSOR (Neural Networks)
# ==============================

class MLPRegressionModel(BaseModel):
    def __init__(self, hidden_layer_sizes=(100, 50), max_iter=1000):
        super().__init__("MLP Regressor")
        self.model = MLPRegressor(
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
def get_regression_model(name: str):
    if name == "Linear Regression":
        return LinearRegressionModel()

    if name == "Random Forest Regressor":
        return RandomForestRegressionModel()

    if name == "KNN":
        return KNNRegressionModel()

    if name == "Decision Tree Regressor":
        return DecisionTreeRegressionModel()

    if name == "SVR":
        return SVRRegressionModel()

    if name == "MLP Regressor":
        return MLPRegressionModel()
    raise ValueError("Unknown regression model")
