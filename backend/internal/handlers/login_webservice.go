package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"codexaac-backend/internal/database"
	"codexaac-backend/pkg/config"
	"codexaac-backend/pkg/utils"
)

type TibiaClientLoginRequest struct {
	Type     string `json:"type"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type TibiaClientErrorResponse struct {
	ErrorCode    int    `json:"errorCode"`
	ErrorMessage string `json:"errorMessage"`
}

type TibiaClientCharacter struct {
	WorldID    int    `json:"worldid"`
	Name       string `json:"name"`
	IsMale     bool   `json:"ismale"`
	Tutorial   bool   `json:"tutorial"`
	Level      int    `json:"level"`
	Vocation   string `json:"vocation"`
	OutfitID   int    `json:"outfitid"`
	HeadColor  int    `json:"headcolor"`
	TorsoColor int    `json:"torsocolor"`
	LegsColor  int    `json:"legscolor"`
	DetailColor int   `json:"detailcolor"`
	AddonsFlags int   `json:"addonsflags"`
	IsHidden   bool   `json:"ishidden"`
	IsTournamentParticipant bool `json:"istournamentparticipant"`
	IsMainCharacter bool `json:"ismaincharacter"`
	DailyRewardState int `json:"dailyrewardstate"`
	RemainingDailyTournamentPlaytime bool `json:"remainingdailytournamentplaytime"`
}

type TibiaClientWorld struct {
	ID                         int    `json:"id"`
	Name                       string `json:"name"`
	ExternalAddress            string `json:"externaladdress"`
	ExternalAddressProtected   string `json:"externaladdressprotected"`
	ExternalAddressUnprotected string `json:"externaladdressunprotected"`
	ExternalPort               int    `json:"externalport"`
	ExternalPortProtected      int    `json:"externalportprotected"`
	ExternalPortUnprotected    int    `json:"externalportunprotected"`
	PreviewState               int    `json:"previewstate"`
	Location                   string `json:"location"`
	AnticheatProtection        bool   `json:"anticheatprotection"`
	PvPType                    int    `json:"pvptype"`
	IsTournamentWorld          bool   `json:"istournamentworld"`
	RestrictedStore            bool   `json:"restrictedstore"`
	CurrentTournamentPhase     int    `json:"currenttournamentphase"`
}

type TibiaClientSession struct {
	SessionKey                   string `json:"sessionkey"`
	LastLoginTime                int64  `json:"lastlogintime"`
	IsPremium                    bool   `json:"ispremium"`
	PremiumUntil                 int64  `json:"premiumuntil"`
	Status                       string `json:"status"`
	ReturnerNotification         bool   `json:"returnernotification"`
	ShowRewardNews               bool   `json:"showrewardnews"`
	IsReturner                   bool   `json:"isreturner"`
	FpsTracking                  bool   `json:"fpstracking"`
	OptionTracking               bool   `json:"optiontracking"`
	TournamentTicketPurchaseState int   `json:"tournamentticketpurchasestate"`
	EmailCodeRequest             bool   `json:"emailcoderequest"`
}

type TibiaClientLoginResponse struct {
	PlayData struct {
		Worlds     []TibiaClientWorld     `json:"worlds"`
		Characters []TibiaClientCharacter `json:"characters"`
	} `json:"playdata"`
	Session TibiaClientSession `json:"session"`
}

func TibiaClientLoginHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.Header().Set("Access-Control-Allow-Methods", "POST")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		sendTibiaError(w, "Method not allowed")
		return
	}

	var req TibiaClientLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendTibiaError(w, "Invalid request")
		return
	}

	if req.Type == "" {
		sendTibiaError(w, "Invalid request type")
		return
	}

	if req.Type != "login" {
		sendTibiaError(w, "Invalid request type")
		return
	}

	if req.Email == "" || req.Password == "" {
		sendTibiaError(w, "Email and password required")
		return
	}

	ctx, cancel := utils.NewDBContext()
	defer cancel()

	var accountID int
	var storedPassword string
	var premdays int
	var lastLogin int64
	err := database.DB.QueryRowContext(ctx,
		"SELECT id, password, premdays, lastday FROM accounts WHERE email = ?",
		req.Email,
	).Scan(&accountID, &storedPassword, &premdays, &lastLogin)

	if err != nil {
		if err == sql.ErrNoRows {
			sendTibiaError(w, "Account not found")
			return
		}
		sendTibiaError(w, "Internal server error")
		return
	}

	calculatedHash := utils.HashSHA1(req.Password)
	if storedPassword != calculatedHash {
		sendTibiaError(w, "Incorrect password")
		return
	}

	serverConfig := config.GetServerConfig()

	rows, err := database.DB.QueryContext(ctx,
		`SELECT p.name, p.level, p.vocation, 
		        COALESCE(p.looktype, 128) as looktype,
		        COALESCE(p.lookhead, 0) as lookhead,
		        COALESCE(p.lookbody, 0) as lookbody,
		        COALESCE(p.looklegs, 0) as looklegs,
		        COALESCE(p.lookfeet, 0) as lookfeet,
		        COALESCE(p.lookaddons, 0) as lookaddons,
		        p.lastlogin, p.sex,
		        COALESCE(p.istutorial, 0) as istutorial,
		        COALESCE(p.isreward, 0) as isreward
		 FROM players p
		 WHERE p.account_id = ? AND p.deletion = 0
		 ORDER BY p.name ASC`,
		accountID,
	)
	if err != nil {
		sendTibiaError(w, "Internal server error")
		return
	}
	defer rows.Close()

	var characters []TibiaClientCharacter
	for rows.Next() {
		var char TibiaClientCharacter
		var vocationID int
		var sex int
		var lastLoginTime int64
		var isTutorial, isReward int

		if err := rows.Scan(
			&char.Name, &char.Level, &vocationID,
			&char.OutfitID, &char.HeadColor, &char.TorsoColor,
			&char.LegsColor, &char.DetailColor, &char.AddonsFlags,
			&lastLoginTime, &sex, &isTutorial, &isReward,
		); err != nil {
			continue
		}

		char.WorldID = 0
		char.Vocation = config.GetVocationName(vocationID)
		char.IsMale = (sex == 1)
		
		if char.OutfitID == 0 {
			if defaultLookType, ok := config.LookTypeMapping[sex]; ok {
				char.OutfitID = defaultLookType
			} else {
				char.OutfitID = 128
			}
		}
		
		char.Tutorial = (isTutorial == 1)
		char.IsHidden = false
		char.IsTournamentParticipant = false
		char.IsMainCharacter = false
		char.DailyRewardState = isReward
		char.RemainingDailyTournamentPlaytime = false

		characters = append(characters, char)
	}

	worldTypeMap := map[string]int{
		"pvp":          0,
		"no-pvp":       1,
		"pvp-enforced": 2,
	}
	pvpType, ok := worldTypeMap[serverConfig.WorldType]
	if !ok {
		pvpType = 0
	}

	world := TibiaClientWorld{
		ID:                         0,
		Name:                       serverConfig.ServerName,
		ExternalAddress:            serverConfig.IP,
		ExternalAddressProtected:   serverConfig.IP,
		ExternalAddressUnprotected: serverConfig.IP,
		ExternalPort:               serverConfig.GamePort,
		ExternalPortProtected:      serverConfig.GamePort,
		ExternalPortUnprotected:    serverConfig.GamePort,
		PreviewState:               0,
		Location:                   serverConfig.Location,
		AnticheatProtection:        false,
		PvPType:                    pvpType,
		IsTournamentWorld:          false,
		RestrictedStore:            false,
		CurrentTournamentPhase:     2,
	}

	premiumUntil := time.Now().Unix()
	isPremium := premdays > 0 || serverConfig.FreePremium
	if premdays > 0 {
		premiumUntil = time.Now().Unix() + int64(premdays*86400)
	} else if serverConfig.FreePremium {
		premiumUntil = time.Now().Unix() + (365 * 24 * 60 * 60)
	}

	session := TibiaClientSession{
		SessionKey:                   req.Email + "\n" + req.Password,
		LastLoginTime:                0,
		IsPremium:                    isPremium,
		PremiumUntil:                 premiumUntil,
		Status:                       "active",
		ReturnerNotification:         false,
		ShowRewardNews:               false,
		IsReturner:                   true,
		FpsTracking:                  false,
		OptionTracking:               false,
		TournamentTicketPurchaseState: 0,
		EmailCodeRequest:             false,
	}

	response := TibiaClientLoginResponse{
		PlayData: struct {
			Worlds     []TibiaClientWorld     `json:"worlds"`
			Characters []TibiaClientCharacter `json:"characters"`
		}{
			Worlds:     []TibiaClientWorld{world},
			Characters: characters,
		},
		Session: session,
	}

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	json.NewEncoder(w).Encode(response)
}

func sendTibiaError(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(TibiaClientErrorResponse{
		ErrorCode:    3,
		ErrorMessage: msg,
	})
}
