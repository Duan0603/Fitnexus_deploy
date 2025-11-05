Ai chưa có python thì tải về nhé

chạy server python

- tải thư viện và tạo môi trường ảo nhớ cd vào AiTrainer:

  - pip install -r requirements.txt
  - python -m venv venv
  - .\venv\Scripts\activate

- sau khi tạo xong môi trường ảo thì khởi động AiService:

  - uvicorn api:app --host 0.0.0.0 --port 8000

- cuối cùng chạy npm run dev ở tư mục FitnexusApp
