import torch
import torch.nn as nn
import numpy as np

def load_pytorch_model(model_class, model_path, device):
    model = model_class()
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval() 
    return model

from model import RawNet
from models import DilatedNet

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

rawnet2_model = load_pytorch_model(RawNet, 'D:\\07. 專題\\frontend\\ai-detection-backend\\model.pth', device)  
tssdnet_model = load_pytorch_model(DilatedNet, 'D:\\07. 專題\\frontend\\ai-detection-backend\\TSSDNet_model.pth', device)  


def ensemble_predict(rawnet2_model, tssdnet_model, input_data, weights=(0.5, 0.5), device=device):
    input_tensor = torch.tensor(input_data, dtype=torch.float32).to(device)

    with torch.no_grad():
        rawnet2_predictions = rawnet2_model(input_tensor)
        tssdnet_predictions = tssdnet_model(input_tensor)

    rawnet2_predictions = rawnet2_predictions.cpu().numpy()
    tssdnet_predictions = tssdnet_predictions.cpu().numpy()

    
    ensemble_predictions = (
        weights[0] * rawnet2_predictions + weights[1] * tssdnet_predictions
    )
    return ensemble_predictions

test_data = np.random.rand(10, 1, 64, 64).astype(np.float32)

weights = (0.6, 0.4) 
ensemble_results = ensemble_predict(rawnet2_model, tssdnet_model, test_data, weights)

print("Ensemble Predictions:", ensemble_results)