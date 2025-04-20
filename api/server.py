# from flask import Flask, request, jsonify
# import yfinance as yf
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)

# @app.route('/stock', methods=['GET'])
# def get_stock_price():
#     symbol = request.args.get('symbol', 'AAPL')  # Default to AAPL if no symbol provided
#     stock = yf.Ticker(symbol)
#     hist = stock.history(period="5d")

#     data = [{"date": str(index.date()), "value": row["Close"]} for index, row in hist.iterrows()]
#     return jsonify(data)

# @app.route('/crypto', methods=['GET'])
# def get_crypto_price():
#     symbol = request.args.get('symbol', 'BTC-USD')  # Default to BTC-USD if no symbol provided
#     crypto = yf.Ticker(symbol)
#     hist = crypto.history(period="5d")

#     data = [{"date": str(index.date()), "value": row["Close"]} for index, row in hist.iterrows()]
#     return jsonify(data)

# @app.route('/gold', methods=['GET'])
# def get_gold_price():
#     try:
#         gold = yf.Ticker("GC=F")  # Gold Futures symbol in Yahoo Finance
#         hist = gold.history(period="5d")

#         if hist.empty:
#             return jsonify({"error": "No gold price data available"}), 404

#         data = [{"date": str(index.date()), "value": row["Close"]} for index, row in hist.iterrows()]
#         return jsonify(data)

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)
